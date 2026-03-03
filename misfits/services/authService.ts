import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  UserCredential,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { Platform } from 'react-native';

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
  'auth/operation-not-supported-in-this-environment': 'Google sign-in is not available in Expo Go. Use email/password authentication or build a development build.',
  'auth/app-check-token-invalid': 'App Check is enforced but Expo Go cannot provide valid tokens. Disable App Check enforcement in Firebase Console (set to Monitor mode) for development.',
  'auth/firebase-app-check-token-is-invalid': 'App Check is enforced but Expo Go cannot provide valid tokens. Disable App Check enforcement in Firebase Console (set to Monitor mode) for development.',
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
    // Google Sign-In with popup/redirect is not supported in Expo Go
    // It requires either:
    // 1. Running on web (where signInWithRedirect works)
    // 2. Using a development build with native Google Sign-In
    // 3. Using expo-auth-session with Google OAuth (requires additional setup)
    
    if (Platform.OS !== 'web') {
      // For now, throw a helpful error in Expo Go
      // In production builds, you would use expo-auth-session or native Google Sign-In
      throw new Error('Google sign-in is not available in Expo Go. Please use email/password authentication, or build a development build for native Google Sign-In support.');
    }
    
    // On web, use redirect flow (works better than popup in some browsers)
    await signInWithRedirect(auth, googleProvider);
    
    // After redirect, get the result
    const result = await getRedirectResult(auth);
    if (!result) {
      throw new Error('Google sign-in was canceled or failed.');
    }
    
    return result;
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
