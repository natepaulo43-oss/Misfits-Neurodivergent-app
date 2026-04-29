/**
 * User Data Management Cloud Functions
 *
 * deleteUserData — callable function that purges ALL Firestore data for the
 * authenticated caller, then deletes their Firebase Auth account.
 *
 * This implements the right-to-erasure requirement under GDPR Article 17 and
 * the deletion right under CCPA. The operation is idempotent: calling it again
 * after partial completion is safe.
 *
 * Collections purged:
 *  - users/{uid}  (+ backupCodes subcollection via recursiveDelete)
 *  - threads where participantIds array-contains uid  (+ messages subcollection)
 *  - sessions where studentId == uid OR mentorId == uid
 *  - matches  where studentId == uid OR mentorId == uid
 *  - mentorAvailability/{uid}
 *  - sessionNotes where mentorId == uid
 *  - blocks where fromUserId == uid OR toUserId == uid
 *  - reports where reportedById == uid
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const BATCH_SIZE = 400; // Firestore max is 500; stay under to be safe

/** Commit a batch and return a fresh one. */
async function flushBatch(
  batch: FirebaseFirestore.WriteBatch,
  db: FirebaseFirestore.Firestore,
): Promise<FirebaseFirestore.WriteBatch> {
  await batch.commit();
  return db.batch();
}

export const deleteUserData = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in to delete your account.');
  }

  const db = admin.firestore();
  let batch = db.batch();
  let opCount = 0;

  const addDelete = async (ref: FirebaseFirestore.DocumentReference) => {
    batch.delete(ref);
    opCount++;
    if (opCount >= BATCH_SIZE) {
      batch = await flushBatch(batch, db);
      opCount = 0;
    }
  };

  try {
    // 1. Message threads (+ messages subcollection via recursiveDelete)
    const threadSnap = await db
      .collection('threads')
      .where('participantIds', 'array-contains', uid)
      .get();

    for (const threadDoc of threadSnap.docs) {
      // recursiveDelete handles the messages subcollection
      await db.recursiveDelete(threadDoc.ref);
    }

    // 2. Sessions (student or mentor)
    const [studentSessions, mentorSessions] = await Promise.all([
      db.collection('sessions').where('studentId', '==', uid).get(),
      db.collection('sessions').where('mentorId', '==', uid).get(),
    ]);
    for (const d of [...studentSessions.docs, ...mentorSessions.docs]) {
      await addDelete(d.ref);
    }

    // 3. Matches (student or mentor)
    const [studentMatches, mentorMatches] = await Promise.all([
      db.collection('matches').where('studentId', '==', uid).get(),
      db.collection('matches').where('mentorId', '==', uid).get(),
    ]);
    for (const d of [...studentMatches.docs, ...mentorMatches.docs]) {
      await addDelete(d.ref);
    }

    // 4. Mentor availability document
    await addDelete(db.collection('mentorAvailability').doc(uid));

    // 5. Session notes authored by this mentor
    const notes = await db.collection('sessionNotes').where('mentorId', '==', uid).get();
    for (const d of notes.docs) {
      await addDelete(d.ref);
    }

    // 6. Blocks (created by or targeting this user)
    const [blocksFrom, blocksTo] = await Promise.all([
      db.collection('blocks').where('fromUserId', '==', uid).get(),
      db.collection('blocks').where('toUserId', '==', uid).get(),
    ]);
    for (const d of [...blocksFrom.docs, ...blocksTo.docs]) {
      await addDelete(d.ref);
    }

    // 7. Message reports submitted by this user
    const reports = await db.collection('reports').where('reportedById', '==', uid).get();
    for (const d of reports.docs) {
      await addDelete(d.ref);
    }

    // Flush remaining batched deletes
    if (opCount > 0) {
      await batch.commit();
    }

    // 8. User document + backupCodes subcollection
    await db.recursiveDelete(db.collection('users').doc(uid));

    // 9. Delete Firebase Auth account last
    await admin.auth().deleteUser(uid);

    console.log(`[deleteUserData] All data purged for uid=${uid}`);
    return { success: true };
  } catch (error) {
    console.error(
      '[deleteUserData] Error during data purge:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    throw new HttpsError(
      'internal',
      'Account deletion failed. Please try again or contact support.',
    );
  }
});
