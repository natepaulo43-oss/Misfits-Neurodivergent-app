import * as functions from 'firebase-functions/v2';

export const exampleCallableFunction = functions.https.onCall(
  {
    // DEVELOPMENT: Set to false for Expo Go compatibility
    // PRODUCTION: Change to true before deploying to production
    enforceAppCheck: false,
    consumeAppCheckToken: false,
  },
  async (request) => {
    const appCheckToken = request.app;
    
    if (!appCheckToken) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'App Check verification failed. This function requires a valid App Check token.'
      );
    }
    
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to call this function.'
      );
    }

    console.log('App Check verified for user:', request.auth.uid);
    console.log('App Check token:', appCheckToken);

    return {
      success: true,
      message: 'Function executed with App Check verification',
      userId: request.auth.uid,
    };
  }
);
