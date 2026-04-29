import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { Change, EventContext } from 'firebase-functions/v1';
import { QueryDocumentSnapshot } from 'firebase-functions/v1/firestore';
import { verifySessionAccess, logAuthError, AuthorizationError } from './middleware/auth';

const db = admin.firestore();

export const onSessionCreated = functions.firestore
  .document('sessions/{sessionId}')
  .onCreate(async (snapshot: QueryDocumentSnapshot, context: EventContext) => {
    const session = snapshot.data();
    const sessionId = context.params.sessionId;

    try {
      verifySessionAccess(session, ['studentId', 'mentorId']);

      console.log(`[Notification Stub][Session ${sessionId}] New session request: student=${session.studentId} mentor=${session.mentorId}`);
      
      return null;
    } catch (error) {
      if (error instanceof AuthorizationError) {
        logAuthError(error, 'onSessionCreated');
        return;
      }
      console.error('[onSessionCreated] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  });

export const onSessionStatusChanged = functions.firestore
  .document('sessions/{sessionId}')
  .onUpdate(async (change: Change<QueryDocumentSnapshot>, context: EventContext) => {
    const before = change.before.data();
    const after = change.after.data();
    const sessionId = context.params.sessionId;

    if (before.status === after.status) {
      return null;
    }

    try {
      verifySessionAccess(after, ['studentId', 'mentorId']);

      const mentorDoc = await db.collection('users').doc(after.mentorId).get();
      const studentDoc = await db.collection('users').doc(after.studentId).get();

      if (!mentorDoc.exists || !studentDoc.exists) {
        console.warn(`[onSessionStatusChanged] User documents not found for session ${sessionId}`);
        return;
      }

      const mentorData = mentorDoc.data();
      const studentData = studentDoc.data();

      let notificationMessage = '';
      let recipientId = '';

      switch (after.status) {
        case 'confirmed':
          recipientId = after.studentId;
          notificationMessage = `${mentorData?.name} accepted your session request!`;
          break;
        case 'declined':
          recipientId = after.studentId;
          notificationMessage = `${mentorData?.name} declined your session request.`;
          break;
        case 'reschedule_proposed':
          recipientId = after.studentId;
          notificationMessage = `${mentorData?.name} proposed alternative times for your session.`;
          break;
        case 'cancelled': {
          const cancelledByMentor = before.updatedBy === after.mentorId;
          const cancelledBy = cancelledByMentor ? mentorData?.name || 'Mentor' : studentData?.name || 'Student';
          recipientId = cancelledByMentor ? after.studentId : after.mentorId;
          notificationMessage = `Session ${sessionId} has been cancelled by ${cancelledBy}.`;
          break;
        }
        case 'completed':
          recipientId = after.studentId;
          notificationMessage = `Your session with ${mentorData?.name} has been marked complete.`;
          break;
      }

      if (recipientId && notificationMessage) {
        console.log(`[Notification Stub][Session ${sessionId}] status=${after.status} recipient=${recipientId}`);
      }

      return null;
    } catch (error) {
      if (error instanceof AuthorizationError) {
        logAuthError(error, 'onSessionStatusChanged');
        return;
      }
      console.error('[onSessionStatusChanged] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  });

export const scheduleSessionReminders = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context: EventContext) => {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    try {
      const sessionsSnapshot = await db
        .collection('sessions')
        .where('status', '==', 'confirmed')
        .get();

      const reminders: Promise<any>[] = [];

      for (const doc of sessionsSnapshot.docs) {
        const session = doc.data();
        const sessionStart = new Date(session.confirmedStart || session.requestedStart);
        const reminderState = session.reminderState || { sent24h: false, sent1h: false };

        if (!reminderState.sent24h && sessionStart <= in24Hours && sessionStart > now) {
          console.log(`[Reminder Stub] 24h reminder for session ${doc.id}`);
          
          reminders.push(
            db.collection('sessions').doc(doc.id).update({
              'reminderState.sent24h': true,
              'reminderState.scheduled24h': now.toISOString(),
            })
          );
        }

        if (!reminderState.sent1h && sessionStart <= in1Hour && sessionStart > now) {
          console.log(`[Reminder Stub] 1h reminder for session ${doc.id}`);
          
          reminders.push(
            db.collection('sessions').doc(doc.id).update({
              'reminderState.sent1h': true,
              'reminderState.scheduled1h': now.toISOString(),
            })
          );
        }
      }

      await Promise.all(reminders);
      console.log(`Processed ${reminders.length} reminders`);

      return null;
    } catch (error) {
      console.error('[scheduleSessionReminders] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  });

export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  console.log(`[Push Notification Stub] queued for user=${userId} title=${title}`);
  
  return {
    success: true,
    message: 'Push notification stub - implement FCM integration',
  };
};
