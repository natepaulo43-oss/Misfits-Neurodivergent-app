import * as functions from 'firebase-functions/v2';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

/**
 * Revokes all refresh tokens for the calling user.
 * Existing ID tokens remain valid until they expire (≤1 hour), after which
 * no new tokens can be obtained. Call this before client-side signOut() so
 * a captured refresh token cannot be used to re-authenticate after logout.
 */
export const revokeUserSession = functions.https.onCall(
  { enforceAppCheck: false },
  async (request): Promise<{ revoked: boolean }> => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    await admin.auth().revokeRefreshTokens(request.auth.uid);
    return { revoked: true };
  }
);

/**
 * Immediately revokes all refresh tokens when an account is suspended.
 * Without this, a suspended user retains a valid session for up to 1 hour
 * (the remaining lifetime of their current ID token).
 */
export const revokeSessionOnSuspension = onDocumentWritten(
  'users/{userId}',
  async (event) => {
    const before = event.data?.before?.data() as Record<string, unknown> | undefined;
    const after = event.data?.after?.data() as Record<string, unknown> | undefined;

    if (after?.accountSuspended === true && before?.accountSuspended !== true) {
      const { userId } = event.params;
      try {
        await admin.auth().revokeRefreshTokens(userId);
        console.log(`[sessionManagement] Revoked tokens for suspended user: ${userId}`);
      } catch (error) {
        console.error(
          `[sessionManagement] Failed to revoke tokens for suspended user ${userId}:`,
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }
  },
);
