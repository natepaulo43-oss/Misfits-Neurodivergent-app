import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
const EXPECTED_ISSUER = 'https://appleid.apple.com';
const EXPECTED_AUDIENCE = 'com.misfits.app';

interface AppleJWKKey {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

interface AppleEvent {
  type: 'email-disabled' | 'email-enabled' | 'consent-revoked' | 'account-delete';
  sub: string;       // Apple user ID
  email?: string;
  is_private_email?: boolean;
  event_time: number;
}

function base64urlDecode(str: string): Buffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  return Buffer.from(padded, 'base64');
}

async function fetchApplePublicKeys(): Promise<AppleJWKKey[]> {
  const response = await fetch(APPLE_JWKS_URL);
  if (!response.ok) throw new Error(`Failed to fetch Apple JWKS: ${response.status}`);
  const data = await response.json() as { keys: AppleJWKKey[] };
  return data.keys;
}

async function verifyAppleJWT(token: string): Promise<Record<string, unknown>> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64urlDecode(headerB64).toString('utf8')) as { kid: string; alg: string };

  if (header.alg !== 'RS256') throw new Error(`Unexpected algorithm: ${header.alg}`);

  const keys = await fetchApplePublicKeys();
  const jwk = keys.find(k => k.kid === header.kid);
  if (!jwk) throw new Error(`No matching Apple public key for kid=${header.kid}`);

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const message = Buffer.from(`${headerB64}.${payloadB64}`);
  const signature = base64urlDecode(signatureB64);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, message);
  if (!valid) throw new Error('Apple JWT signature verification failed');

  const claims = JSON.parse(base64urlDecode(payloadB64).toString('utf8')) as Record<string, unknown>;

  if (claims.iss !== EXPECTED_ISSUER) throw new Error(`Unexpected issuer: ${claims.iss}`);
  if (claims.aud !== EXPECTED_AUDIENCE) throw new Error(`Unexpected audience: ${claims.aud}`);

  return claims;
}

async function handleAppleEvent(event: AppleEvent): Promise<void> {
  const { type, sub: appleUserId } = event;
  console.log(`[appleNotifications] Received event=${type} for Apple UID=${appleUserId}`);

  switch (type) {
    case 'email-disabled':
    case 'email-enabled': {
      // No action needed — Firebase stores its own email; Apple relay changes don't affect it.
      console.log(`[appleNotifications] Email relay changed to ${type} for Apple UID=${appleUserId}`);
      break;
    }

    case 'consent-revoked': {
      // User revoked app consent — revoke their Firebase session tokens.
      try {
        const userRecord = await admin.auth().getUserByProviderUid('apple.com', appleUserId);
        await admin.auth().revokeRefreshTokens(userRecord.uid);
        console.log(`[appleNotifications] Revoked tokens for uid=${userRecord.uid}`);
      } catch (err) {
        console.warn(`[appleNotifications] Could not find user for Apple UID=${appleUserId}:`, err);
      }
      break;
    }

    case 'account-delete': {
      // User deleted their Apple ID — delete their Firebase account and all data.
      try {
        const userRecord = await admin.auth().getUserByProviderUid('apple.com', appleUserId);
        await purgeUserData(userRecord.uid);
        console.log(`[appleNotifications] Deleted account for uid=${userRecord.uid}`);
      } catch (err) {
        console.warn(`[appleNotifications] Could not delete user for Apple UID=${appleUserId}:`, err);
      }
      break;
    }

    default:
      console.warn(`[appleNotifications] Unknown event type: ${type}`);
  }
}

async function purgeUserData(uid: string): Promise<void> {
  const db = admin.firestore();

  const [studentSessions, mentorSessions, studentMatches, mentorMatches,
    notes, blocksFrom, blocksTo, reports, threads] = await Promise.all([
    db.collection('sessions').where('studentId', '==', uid).get(),
    db.collection('sessions').where('mentorId', '==', uid).get(),
    db.collection('matches').where('studentId', '==', uid).get(),
    db.collection('matches').where('mentorId', '==', uid).get(),
    db.collection('sessionNotes').where('mentorId', '==', uid).get(),
    db.collection('blocks').where('fromUserId', '==', uid).get(),
    db.collection('blocks').where('toUserId', '==', uid).get(),
    db.collection('reports').where('reportedById', '==', uid).get(),
    db.collection('threads').where('participantIds', 'array-contains', uid).get(),
  ]);

  for (const doc of threads.docs) {
    await db.recursiveDelete(doc.ref);
  }

  const allDocs = [
    ...studentSessions.docs, ...mentorSessions.docs,
    ...studentMatches.docs, ...mentorMatches.docs,
    ...notes.docs, ...blocksFrom.docs, ...blocksTo.docs, ...reports.docs,
  ];

  const BATCH_SIZE = 400;
  for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    allDocs.slice(i, i + BATCH_SIZE).forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  await db.recursiveDelete(db.collection('users').doc(uid));
  await db.collection('mentorAvailability').doc(uid).delete();
  await admin.auth().deleteUser(uid);
}

export const appleNotifications = onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const payload = (req.body as Record<string, string>)?.payload;
    if (!payload || typeof payload !== 'string') {
      res.status(400).send('Missing payload');
      return;
    }

    try {
      const claims = await verifyAppleJWT(payload);
      const eventsRaw = claims.events;
      const event: AppleEvent = typeof eventsRaw === 'string'
        ? JSON.parse(eventsRaw)
        : eventsRaw as AppleEvent;

      await handleAppleEvent(event);
      res.status(200).send('OK');
    } catch (error) {
      console.error('[appleNotifications] Failed to process notification:', error);
      // Always return 200 to Apple to prevent retries for bad data.
      // Only return non-200 for transient server errors.
      res.status(200).send('OK');
    }
  },
);
