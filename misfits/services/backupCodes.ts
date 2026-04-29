import { getFunctions, httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { app, auth } from './firebase';

const fns = getFunctions(app);

export const generateBackupCodes = async (): Promise<string[]> => {
  const fn = httpsCallable<void, { codes: string[] }>(fns, 'generateBackupCodes');
  const result = await fn();
  return result.data.codes;
};

/**
 * Exchanges an email + backup code for a Firebase custom token, then signs in.
 * The resulting session bypasses the MFA challenge — the user is fully authenticated
 * once this resolves.
 */
export const redeemAndSignIn = async (email: string, code: string): Promise<void> => {
  const fn = httpsCallable<{ email: string; code: string }, { customToken: string }>(
    fns,
    'redeemBackupCode'
  );
  const result = await fn({ email, code });
  await signInWithCustomToken(auth, result.data.customToken);
};
