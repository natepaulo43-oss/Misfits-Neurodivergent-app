import { useEffect, useRef, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '../context/AuthContext';

// Required for the OAuth redirect to complete in the in-app browser on native
WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn(
  onSuccess: () => void,
  onError: (message: string) => void,
) {
  const { loginWithGoogleNative } = useAuth();
  const [loading, setLoading] = useState(false);
  const handledRef = useRef(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (!response || response.type !== 'success') return;
    // Guard against double-firing (StrictMode, concurrent renders)
    if (handledRef.current) return;
    handledRef.current = true;

    const idToken =
      (response as any).authentication?.idToken ??
      (response as any).params?.id_token;

    if (!idToken) {
      onError('Google sign-in failed: no ID token received.');
      handledRef.current = false;
      return;
    }

    setLoading(true);
    loginWithGoogleNative(idToken)
      .then(() => onSuccess())
      .catch((err: Error) => {
        if (err.message !== 'MFA verification required') {
          onError(err.message);
        }
        // MFA case: mfaRequired in context will be set; caller shows MFAChallenge
      })
      .finally(() => {
        setLoading(false);
        handledRef.current = false;
      });
  }, [response]);

  const signIn = () => {
    promptAsync();
  };

  return {
    signIn,
    loading: loading || !request,
  };
}
