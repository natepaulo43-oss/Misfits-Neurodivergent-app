import { useEffect, useRef, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { deleteGoogleUserAccount } from '../services/authService';

// Required for the OAuth redirect to complete in the in-app browser on native
WebBrowser.maybeCompleteAuthSession();

/**
 * Drives the Google re-authentication + account deletion flow on iOS native.
 *
 * Call `initiateGoogleDelete()` from a user-initiated action (e.g. an Alert
 * confirmation button). The hook opens the Google OAuth browser, extracts the
 * ID token from the response, passes it to `deleteGoogleUserAccount`, and then
 * calls `onSuccess` or `onError` depending on the outcome.
 *
 * `loading` is true from the moment `initiateGoogleDelete()` is called until
 * the deletion resolves or the user cancels the browser.
 */
export function useGoogleDeleteAccount(
  onSuccess: () => void,
  onError: (message: string) => void,
) {
  const [loading, setLoading] = useState(false);
  const handledRef = useRef(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type !== 'success') {
      setLoading(false);
      if (response.type === 'error') {
        onError('Google sign-in failed. Please try again.');
      }
      return;
    }

    // Guard against double-firing (StrictMode, concurrent renders)
    if (handledRef.current) return;
    handledRef.current = true;

    const idToken =
      (response as any).authentication?.idToken ??
      (response as any).params?.id_token;

    if (!idToken) {
      onError('Google sign-in failed: no ID token received.');
      handledRef.current = false;
      setLoading(false);
      return;
    }

    deleteGoogleUserAccount(idToken)
      .then(() => onSuccess())
      .catch((err: Error) => onError(err.message))
      .finally(() => {
        setLoading(false);
        handledRef.current = false;
      });
  }, [response]);

  return {
    initiateGoogleDelete: () => {
      setLoading(true);
      promptAsync();
    },
    loading: loading || !request,
  };
}
