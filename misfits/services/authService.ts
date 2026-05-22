import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  OAuthProvider,
  OAuthCredential,
  UserCredential,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  linkWithCredential,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { auth, app } from './firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const firebaseErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'Invalid email or password. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/invalid-password': 'Invalid email or password. Please try again.',
  'auth/wrong-password': 'Invalid email or password. Please try again.',
  'auth/user-not-found': 'Invalid email or password. Please try again.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/popup-closed-by-user': 'Google sign-in was canceled.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.',
  'auth/cancelled-popup-request': 'Google sign-in was canceled.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email address. Sign in with your password to link your Google account.',
  'auth/operation-not-supported-in-this-environment':
    'Google sign-in is not available in Expo Go. Use email/password authentication or build a development build.',
  'auth/app-check-token-invalid':
    'App Check is enforced but Expo Go cannot provide valid tokens. Disable App Check enforcement in Firebase Console (set to Monitor mode) for development.',
  'auth/firebase-app-check-token-is-invalid':
    'App Check is enforced but Expo Go cannot provide valid tokens. Disable App Check enforcement in Firebase Console (set to Monitor mode) for development.',
  'auth/requires-recent-login':
    'For security reasons, please log in again before deleting your account.',
  'auth/invalid-credential': 'Invalid password. Please try again.',
};

const normalizeFirebaseError = (error: unknown): Error => {
  if (error instanceof FirebaseError) {
    const message =
      firebaseErrorMessages[error.code] || error.message || 'Unable to complete the request.';
    const normalizedError = new Error(message);
    normalizedError.name = error.code;
    return normalizedError;
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('Unexpected error occurred.');
};

// ─── Pending Google credential (account-linking) ─────────────────────────────
//
// When Firebase returns auth/account-exists-with-different-credential, we store
// the Google credential here. After the user signs in with their password we
// call linkPendingGoogleCredential() to merge the accounts.

let _pendingLinkEmail: string | null = null;
let _pendingLinkCredential: OAuthCredential | null = null;

function capturePendingCredential(error: FirebaseError): void {
  const email = (error.customData?.email ?? '') as string;
  const cred = GoogleAuthProvider.credentialFromError(error);
  if (email && cred) {
    _pendingLinkEmail = email;
    _pendingLinkCredential = cred;
  }
}

export const getPendingLinkEmail = (): string | null => _pendingLinkEmail;

export const clearPendingLinkState = (): void => {
  _pendingLinkEmail = null;
  _pendingLinkCredential = null;
};

/** Called after a successful email/password sign-in to merge a pending Google credential. */
export const linkPendingGoogleCredential = async (): Promise<void> => {
  if (!auth.currentUser || !_pendingLinkCredential) return;
  try {
    await linkWithCredential(auth.currentUser, _pendingLinkCredential);
  } finally {
    clearPendingLinkState();
  }
};

// ─── Auth functions ───────────────────────────────────────────────────────────

export const registerWithEmail = async (
  email: string,
  password: string,
): Promise<UserCredential> => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
};

export const loginWithEmail = async (
  email: string,
  password: string,
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
};

/**
 * Web Google sign-in via popup.
 * signInWithPopup is synchronous (no page navigation) so errors including
 * auth/account-exists-with-different-credential are handled in the same call stack.
 */
export const loginWithGoogle = async (): Promise<UserCredential> => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === 'auth/account-exists-with-different-credential'
    ) {
      capturePendingCredential(error);
    }
    throw normalizeFirebaseError(error);
  }
};

/**
 * Native Google sign-in: takes a Google ID token (from expo-auth-session)
 * and signs into Firebase. Same account-exists handling as the web path.
 */
export const loginWithGoogleIdToken = async (idToken: string): Promise<UserCredential> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    return await signInWithCredential(auth, credential);
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === 'auth/account-exists-with-different-credential'
    ) {
      capturePendingCredential(error);
    }
    throw normalizeFirebaseError(error);
  }
};

/**
 * Native Apple Sign In: takes an Apple identity token and raw nonce,
 * creates an OAuthCredential, and signs into Firebase.
 */
export const loginWithAppleIdToken = async (
  identityToken: string,
  rawNonce: string,
): Promise<UserCredential> => {
  try {
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken: identityToken, rawNonce });
    return await signInWithCredential(auth, credential);
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
};

const callRevokeUserSession = async (): Promise<void> => {
  if (!auth.currentUser) return;
  try {
    const fns = getFunctions(app);
    const revoke = httpsCallable(fns, 'revokeUserSession');
    await revoke();
  } catch (err) {
    // Best-effort — a network failure must not prevent the local sign-out,
    // but log the failure so it is visible in production monitoring.
    console.warn('[auth] Server-side token revocation failed; local sign-out will still proceed.', err);
  }
};

export const logout = async (): Promise<void> => {
  await callRevokeUserSession();
  try {
    await signOut(auth);
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
};

/** Revokes all active sessions across every device, then signs out locally. */
export const revokeAllSessions = async (): Promise<void> => {
  const fns = getFunctions(app);
  const revoke = httpsCallable(fns, 'revokeUserSession');
  await revoke(); // throws on failure — intentional (caller should surface the error)
  await signOut(auth);
};

// ─── Account deletion ─────────────────────────────────────────────────────────
//
// Both email/password and Google deletion share the same post-reauth steps:
// call the deleteUserData Cloud Function, then sign out locally.

const purgeAccountAfterReauth = async (): Promise<void> => {
  const fns = getFunctions(app);
  const deleteUserData = httpsCallable(fns, 'deleteUserData');
  await deleteUserData();
  try {
    await signOut(auth);
  } catch {
    // Expected to fail if the session token is already invalidated; safe to ignore.
  }
};

/**
 * Permanently deletes an email/password account.
 *
 * Flow:
 *  1. Re-authenticate with the user's password (required by Firebase for destructive ops).
 *  2. Call the `deleteUserData` Cloud Function which uses the Admin SDK to purge all data
 *     and remove the Firebase Auth account.
 *  3. Sign out locally.
 */
export const deleteUserAccount = async (password: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No authenticated user found.');

    const hasPasswordProvider = user.providerData.some((p) => p.providerId === 'password');
    if (!hasPasswordProvider) {
      throw new Error(
        'Your account uses Google Sign-In. Please use the Google sign-in option to confirm account deletion.',
      );
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    await purgeAccountAfterReauth();
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
};

/**
 * Permanently deletes a Google-authenticated account.
 *
 * The caller must supply a fresh Google ID token obtained via expo-auth-session
 * immediately before calling this function. The token is used to re-authenticate
 * the user before the destructive operation, satisfying both Firebase's
 * requires-recent-login requirement and Apple App Store guidelines.
 */
export const deleteGoogleUserAccount = async (idToken: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found.');

    const credential = GoogleAuthProvider.credential(idToken);
    await reauthenticateWithCredential(user, credential);
    await purgeAccountAfterReauth();
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
};
