/**
 * Block service
 *
 * Provides bidirectional user blocking so that:
 *  - A blocked user cannot message the blocker
 *  - A blocked user cannot see the blocker's profile in discovery
 *
 * Document ID convention: `{fromUserId}_{toUserId}`
 * This makes existence checks O(1) both server-side (Firestore rules use
 * `exists()` on a known document path) and client-side.
 *
 * The Firestore `blocks` collection rules enforce:
 *  - Only the blocking user can create/delete their own block
 *  - Both parties can read a block (e.g. to detect they've been blocked)
 *  - Admins have full read/write access
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentUser } from './auth';
import { BlockRecord } from '../types';

const blocksCollection = collection(db, 'blocks');

const blockDocId = (fromUserId: string, toUserId: string): string =>
  `${fromUserId}_${toUserId}`;

const ensureOwner = (fromUserId: string): void => {
  const user = getCurrentUser();
  if (!user || user.id !== fromUserId) {
    throw new Error('Unauthorized: you may only manage your own blocks.');
  }
};

/**
 * Block `toUserId`. Idempotent — calling it again is a no-op.
 * The document ID encodes the direction so rules can enforce ownership.
 */
export const blockUser = async (fromUserId: string, toUserId: string): Promise<void> => {
  ensureOwner(fromUserId);
  if (fromUserId === toUserId) throw new Error('You cannot block yourself.');

  const record: BlockRecord = {
    fromUserId,
    toUserId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(blocksCollection, blockDocId(fromUserId, toUserId)), record);
};

/**
 * Remove a block previously created by `fromUserId` against `toUserId`.
 * Idempotent — no error if the block does not exist.
 */
export const unblockUser = async (fromUserId: string, toUserId: string): Promise<void> => {
  ensureOwner(fromUserId);

  try {
    await deleteDoc(doc(blocksCollection, blockDocId(fromUserId, toUserId)));
  } catch (error) {
    console.error('[block] Failed to unblock user', error);
    throw error instanceof Error ? error : new Error('Unable to remove block.');
  }
};

/**
 * Returns true if `fromUserId` has blocked `toUserId` OR `toUserId` has blocked
 * `fromUserId`. Used client-side before attempting to start a thread.
 */
export const isEitherBlocked = async (
  userA: string,
  userB: string,
): Promise<boolean> => {
  try {
    const [aBlocksB, bBlocksA] = await Promise.all([
      getDoc(doc(blocksCollection, blockDocId(userA, userB))),
      getDoc(doc(blocksCollection, blockDocId(userB, userA))),
    ]);
    return aBlocksB.exists() || bBlocksA.exists();
  } catch (error) {
    // If Firestore rules deny the read (e.g. rules not yet deployed with resource==null
    // guard for non-existent docs), assume no block exists. The server-side exists()
    // checks in the threads/messages create rules still enforce blocks on write.
    console.error('[block] isEitherBlocked check failed, assuming no block:', error);
    return false;
  }
};

/**
 * Returns the list of user IDs that `userId` has blocked.
 * Used to filter mentor/student lists on the client.
 */
export const getBlockedByUser = async (userId: string): Promise<string[]> => {
  try {
    const snap = await getDocs(
      query(blocksCollection, where('fromUserId', '==', userId)),
    );
    return snap.docs.map(d => (d.data() as BlockRecord).toUserId);
  } catch (error) {
    console.error('[block] Failed to fetch blocked users', error);
    return [];
  }
};

/**
 * Returns the list of user IDs that have blocked `userId`.
 * Used to hide profiles and suppress message capabilities.
 */
export const getBlockersOf = async (userId: string): Promise<string[]> => {
  try {
    const snap = await getDocs(
      query(blocksCollection, where('toUserId', '==', userId)),
    );
    return snap.docs.map(d => (d.data() as BlockRecord).fromUserId);
  } catch (error) {
    console.error('[block] Failed to fetch blockers', error);
    return [];
  }
};
