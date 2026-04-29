import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

/**
 * Fires every time a new message document is written under
 * /threads/{threadId}/messages/{messageId}.
 *
 * Looks up the recipient's stored Expo push token and, if present,
 * sends a FCM notification so the device can display a system push alert.
 *
 * Gracefully no-ops when:
 *  - the recipient doc doesn't exist
 *  - the recipient has no pushToken field
 *  - the recipient's account is suspended or messaging is disabled
 *  - FCM rejects the token (stale/invalid tokens are logged but not re-thrown)
 */
export const onMessageCreated = onDocumentCreated(
  'threads/{threadId}/messages/{messageId}',
  async (event) => {
    const messageData = event.data?.data() as
      | { fromUserId: string; toUserId: string; text: string; timestamp: string }
      | undefined;

    if (!messageData?.toUserId || !messageData?.fromUserId) return;

    const { toUserId, fromUserId, text } = messageData;
    const { threadId } = event.params;

    try {
      const [recipientSnap, senderSnap] = await Promise.all([
        admin.firestore().collection('users').doc(toUserId).get(),
        admin.firestore().collection('users').doc(fromUserId).get(),
      ]);

      const recipient = recipientSnap.data();
      if (!recipient) return;

      // Respect account-level messaging controls
      if (recipient.accountSuspended || recipient.messagingDisabled) return;

      const pushToken: string | undefined = recipient.pushToken;
      if (!pushToken) return;

      const senderName: string = senderSnap.data()?.name ?? 'Someone';
      // Truncate message preview to 100 chars
      const preview = text.length > 100 ? `${text.slice(0, 97)}…` : text;

      const message: admin.messaging.Message = {
        token: pushToken,
        notification: {
          title: `New message from ${senderName}`,
          body: preview,
        },
        data: {
          threadId,
          messageId: event.params.messageId,
          type: 'new_message',
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      await admin.messaging().send(message);
      console.log(`[onMessageCreated] Push sent to ${toUserId} for thread ${threadId}`);
    } catch (error) {
      // Log but never surface — a failed notification must not affect message delivery.
      console.error(
        '[onMessageCreated] Failed to send push notification:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);
