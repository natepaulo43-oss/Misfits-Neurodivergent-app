/**
 * Push notification helpers (client-side).
 *
 * Token registration: call `savePushToken` after the Expo
 * Notifications API grants permission and returns an Expo/FCM token.
 * The token is stored on the user's Firestore document so the
 * `onMessageCreated` Cloud Function can look it up when sending alerts.
 *
 * Native setup (APNs key + GoogleService-Info.plist / google-services.json)
 * must be configured in the Expo app.config before push tokens will resolve
 * on a real device. See docs/PUSH_NOTIFICATION_SETUP.md for instructions.
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Persist an Expo / FCM push token on the user's Firestore document.
 * The Cloud Function `onMessageCreated` reads this field when a new
 * message arrives and uses it to dispatch a system notification.
 *
 * Safe to call with an empty/null token — it will be a no-op.
 */
export const savePushToken = async (userId: string, token: string): Promise<void> => {
  if (!userId || !token) return;
  try {
    await updateDoc(doc(db, 'users', userId), { pushToken: token });
  } catch (error) {
    console.error('[notifications] Failed to save push token:', error);
  }
};

/**
 * Remove the stored push token (e.g. on logout or when the user
 * disables notifications). Pass an empty string to clear the field.
 */
export const clearPushToken = async (userId: string): Promise<void> => {
  if (!userId) return;
  try {
    await updateDoc(doc(db, 'users', userId), { pushToken: '' });
  } catch (error) {
    console.error('[notifications] Failed to clear push token:', error);
  }
};
