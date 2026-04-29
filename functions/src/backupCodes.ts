import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

const BACKUP_CODE_COUNT = 10;
const BCRYPT_ROUNDS = 12;
const MAX_REDEEM_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Unambiguous character set — no 0/O, 1/I/L
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode(): string {
  const bytes = crypto.randomBytes(10);
  const chars = Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join('');
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}

/**
 * Generates 10 backup codes for the authenticated user.
 * Any previously generated codes are atomically replaced.
 * Returns the 10 plaintext codes — these are NEVER stored and cannot be retrieved again.
 */
export const generateBackupCodes = functions.https.onCall(
  { enforceAppCheck: false },
  async (request): Promise<{ codes: string[] }> => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const uid = request.auth.uid;
    const db = admin.firestore();
    const codesRef = db.collection('users').doc(uid).collection('backupCodes');

    const plainCodes = Array.from({ length: BACKUP_CODE_COUNT }, makeCode);

    // Hash all codes in parallel — cost 12 takes ~250 ms each; parallel keeps total under 1 s
    const hashes = await Promise.all(plainCodes.map((c) => bcrypt.hash(c, BCRYPT_ROUNDS)));

    // Delete all existing codes and write fresh ones atomically
    const batch = db.batch();
    const existing = await codesRef.get();
    existing.docs.forEach((d) => batch.delete(d.ref));
    hashes.forEach((hash) => {
      batch.set(codesRef.doc(), {
        hash,
        used: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    return { codes: plainCodes };
  }
);

/**
 * Redeems a backup code for account recovery when MFA phone is unavailable.
 * - Accepts unauthenticated requests (the whole point of recovery)
 * - Rate-limited to 5 attempts per hour per account
 * - Marks the code used atomically (concurrent requests cannot double-redeem)
 * - Returns a Firebase custom token; client calls signInWithCustomToken() to complete sign-in
 */
export const redeemBackupCode = functions.https.onCall(
  { enforceAppCheck: false },
  async (request): Promise<{ customToken: string }> => {
    const data = request.data as Record<string, unknown>;
    const email =
      typeof data.email === 'string' ? data.email.trim().toLowerCase().slice(0, 254) : '';
    const code =
      typeof data.code === 'string' ? data.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

    // Normalise to XXXXX-XXXXX if user typed without hyphen
    const normalizedCode =
      code.length === 10 ? `${code.slice(0, 5)}-${code.slice(5)}` : code;

    if (!email || normalizedCode.length !== 11) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email or backup code.');
    }

    const db = admin.firestore();

    // Resolve UID — return the same error whether the email exists or not (prevent enumeration)
    let uid: string;
    try {
      const record = await admin.auth().getUserByEmail(email);
      uid = record.uid;
    } catch {
      throw new functions.https.HttpsError('not-found', 'Invalid email or backup code.');
    }

    const userRef = db.collection('users').doc(uid);

    // Atomically check and increment the attempt counter before touching codes (fail-safe: even
    // if code lookup fails, the attempt is counted so brute-force is bounded)
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const d = snap.data() ?? {};
      const now = Date.now();
      const windowStart: number =
        (d.backupCodeAttemptWindowStart as admin.firestore.Timestamp | undefined)?.toMillis() ?? 0;
      const inWindow = windowStart + ATTEMPT_WINDOW_MS > now;
      const currentAttempts: number = inWindow
        ? ((d.backupCodeAttempts as number | undefined) ?? 0)
        : 0;

      if (currentAttempts >= MAX_REDEEM_ATTEMPTS) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Too many attempts. Try again in an hour.'
        );
      }

      const update: Record<string, unknown> = { backupCodeAttempts: currentAttempts + 1 };
      if (!inWindow) {
        update.backupCodeAttemptWindowStart = admin.firestore.Timestamp.fromMillis(now);
      }
      tx.set(userRef, update, { merge: true });
    });

    // Fetch unused codes and check each hash sequentially (early-exit on match)
    const codesSnap = await db
      .collection('users')
      .doc(uid)
      .collection('backupCodes')
      .where('used', '==', false)
      .get();

    if (codesSnap.empty) {
      throw new functions.https.HttpsError('not-found', 'Invalid email or backup code.');
    }

    let matchedId: string | null = null;
    for (const doc of codesSnap.docs) {
      const isMatch = await bcrypt.compare(normalizedCode, doc.data().hash as string);
      if (isMatch) {
        matchedId = doc.id;
        break;
      }
    }

    if (!matchedId) {
      throw new functions.https.HttpsError('not-found', 'Invalid email or backup code.');
    }

    // Mark the matched code used inside a transaction — handles concurrent redemption races
    const codeRef = db.collection('users').doc(uid).collection('backupCodes').doc(matchedId);
    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(codeRef);
        if (!snap.exists || snap.data()?.used === true) {
          throw new Error('already_used');
        }
        tx.update(codeRef, {
          used: true,
          usedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'already_used') {
        throw new functions.https.HttpsError('not-found', 'Invalid email or backup code.');
      }
      throw err;
    }

    // Reset attempt counter on success so the account isn't locked out on next recovery attempt
    await userRef.set({ backupCodeAttempts: 0 }, { merge: true });

    // Revoke all existing sessions before issuing the recovery token — the user is recovering
    // because their phone factor is unavailable or compromised, so old sessions must not persist.
    await admin.auth().revokeRefreshTokens(uid);

    // Mint a custom token — signInWithCustomToken() on the client bypasses the MFA challenge
    const customToken = await admin.auth().createCustomToken(uid, { bypassedMfa: true });
    return { customToken };
  }
);
