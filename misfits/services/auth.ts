import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from './firebase';
import { User, UserRole } from '../types';

let currentUser: User | null = null;

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

type FirestoreUserData = {
  name?: string;
  email?: string;
  role?: UserRole | null;
  interests?: string[];
  learningDifferences?: string[];
};

const userDocRef = (userId: string) => doc(db, 'users', userId);

const buildUserFromData = (
  userId: string,
  data: FirestoreUserData = {},
  fallback?: FirebaseUser | null,
): User => ({
  id: userId,
  name: data.name ?? fallback?.displayName ?? '',
  email: data.email ?? fallback?.email ?? '',
  role: typeof data.role === 'string' ? data.role : null,
  interests: data.interests,
  learningDifferences: data.learningDifferences,
});

const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
  const ref = userDocRef(firebaseUser.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    const defaultData: FirestoreUserData = {
      name: firebaseUser.displayName ?? '',
      email: firebaseUser.email ?? '',
      role: null,
    };
    await setDoc(ref, defaultData, { merge: true });
    return buildUserFromData(firebaseUser.uid, defaultData, firebaseUser);
  }

  const data = snapshot.data() as FirestoreUserData;
  return buildUserFromData(firebaseUser.uid, data, firebaseUser);
};

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void,
): (() => void) => {
  return onAuthStateChanged(auth, firebaseUser => {
    if (!firebaseUser) {
      currentUser = null;
      callback(null);
      return;
    }

    fetchUserProfile(firebaseUser)
      .then(profile => {
        currentUser = profile;
        callback(profile);
      })
      .catch(error => {
        console.error('Failed to fetch user profile', error);
        callback(null);
      });
  });
};

export const login = async (data: LoginData): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
  currentUser = await fetchUserProfile(credential.user);
  return currentUser;
};

export const signUp = async (data: SignUpData): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  if (data.name) {
    try {
      await updateProfile(credential.user, { displayName: data.name });
    } catch (error) {
      console.warn('Failed to set display name', error);
    }
  }

  const newUserData: FirestoreUserData = {
    name: data.name,
    email: data.email,
    role: null,
  };
  await setDoc(userDocRef(credential.user.uid), newUserData, { merge: true });

  currentUser = buildUserFromData(credential.user.uid, newUserData, credential.user);
  return currentUser;
};

export const logout = async (): Promise<void> => {
  await firebaseSignOut(auth);
  currentUser = null;
};

export const getCurrentUser = (): User | null => currentUser;

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  await setDoc(userDocRef(userId), { role }, { merge: true });

  if (currentUser && currentUser.id === userId) {
    currentUser = { ...currentUser, role };
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>,
): Promise<User> => {
  const allowedUpdates: FirestoreUserData = {};

  if (typeof updates.name === 'string') allowedUpdates.name = updates.name;
  if (typeof updates.email === 'string') allowedUpdates.email = updates.email;
  if (typeof updates.role === 'string' || updates.role === null) {
    allowedUpdates.role = updates.role as UserRole | null;
  }
  if (Array.isArray(updates.interests)) allowedUpdates.interests = updates.interests;
  if (Array.isArray(updates.learningDifferences)) {
    allowedUpdates.learningDifferences = updates.learningDifferences;
  }

  if (Object.keys(allowedUpdates).length > 0) {
    await setDoc(userDocRef(userId), allowedUpdates, { merge: true });
  }

  const snapshot = await getDoc(userDocRef(userId));
  const data = snapshot.exists() ? (snapshot.data() as FirestoreUserData) : {};
  const fallback = auth.currentUser && auth.currentUser.uid === userId ? auth.currentUser : null;

  currentUser = buildUserFromData(userId, data, fallback);
  return currentUser;
};
