import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  UserCredential,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const firebaseErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/invalid-password': 'The password provided is invalid.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/popup-closed-by-user': 'Google sign-in was canceled.',
};

const normalizeFirebaseError = (error: unknown): Error => {
  if (error instanceof FirebaseError) {
    const message = firebaseErrorMessages[error.code] || error.message || 'Unable to complete the request.';
    const normalizedError = new Error(message);
    normalizedError.name = error.code;
    return normalizedError;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Unexpected error occurred.');
};

export const registerWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
};

export const loginWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
};

export const loginWithGoogle = async (): Promise<UserCredential> => {
  try {
    return await signInWithPopup(auth, googleProvider);
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

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
};
