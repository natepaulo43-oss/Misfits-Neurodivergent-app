import { useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { useAuth } from '../context/AuthContext';

function generateNonce(length = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

export function useAppleSignIn(
  onSuccess: () => void,
  onError: (message: string) => void,
) {
  const { loginWithApple } = useAuth();
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    try {
      const rawNonce = generateNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        onError('Apple sign-in failed: no identity token received.');
        return;
      }

      // Apple only provides fullName on the first sign-in ever. Capture it now.
      const givenName = credential.fullName?.givenName ?? '';
      const familyName = credential.fullName?.familyName ?? '';
      const fullName = [givenName, familyName].filter(Boolean).join(' ') || undefined;

      await loginWithApple(credential.identityToken, rawNonce, fullName);
      onSuccess();
    } catch (err: any) {
      if (err?.code === 'ERR_REQUEST_CANCELED') {
        // User canceled — not an error worth showing
        return;
      }
      if (err?.message !== 'MFA verification required') {
        onError(err?.message ?? 'Apple sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading };
}
