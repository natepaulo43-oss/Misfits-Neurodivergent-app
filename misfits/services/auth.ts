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
import { MentorApplicationStatus, User, UserRole } from '../types';

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
  pendingRole?: UserRole | null;
  mentorApplicationStatus?: MentorApplicationStatus;
  mentorApplicationSubmittedAt?: string;
  mentorApplicationAdminNotes?: string;
  mentorApplicationAppealText?: string;
  mentorApplicationAppealSubmittedAt?: string;
  interests?: string[];
  learningDifferences?: string[];
  onboardingCompleted?: boolean;
  studentProfile?: User['studentProfile'];
  mentorProfile?: User['mentorProfile'];
  accountSuspended?: boolean;
  suspensionReason?: string;
  messagingDisabled?: boolean;
  mentorMatchingDisabled?: boolean;
};

const userDocRef = (userId: string) => doc(db, 'users', userId);

const removeUndefinedFields = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(item => removeUndefinedFields(item)).filter(item => item !== undefined);
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).reduce<Record<string, any>>((acc, [key, val]) => {
      const cleaned = removeUndefinedFields(val);
      if (cleaned !== undefined) {
        acc[key] = cleaned;
      }
      return acc;
    }, {});

    return Object.keys(entries).length ? entries : undefined;
  }

  return value === undefined ? undefined : value;
};

const buildUserFromData = (
  userId: string,
  data: FirestoreUserData = {},
  fallback?: FirebaseUser | null,
): User => ({
  id: userId,
  name: data.name ?? fallback?.displayName ?? '',
  email: data.email ?? fallback?.email ?? '',
  role: typeof data.role === 'string' ? data.role : null,
  pendingRole: typeof data.pendingRole === 'string' ? data.pendingRole : null,
  mentorApplicationStatus: data.mentorApplicationStatus ?? 'not_requested',
  mentorApplicationSubmittedAt: data.mentorApplicationSubmittedAt,
  mentorApplicationAdminNotes: data.mentorApplicationAdminNotes,
  mentorApplicationAppealText: data.mentorApplicationAppealText,
  mentorApplicationAppealSubmittedAt: data.mentorApplicationAppealSubmittedAt,
  interests: data.interests,
  learningDifferences: data.learningDifferences,
  onboardingCompleted: data.onboardingCompleted ?? false,
  studentProfile: data.studentProfile,
  mentorProfile: data.mentorProfile,
  accountSuspended: data.accountSuspended ?? false,
  suspensionReason: data.suspensionReason,
  messagingDisabled: data.messagingDisabled ?? false,
  mentorMatchingDisabled: data.mentorMatchingDisabled ?? false,
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
    onboardingCompleted: false,
    pendingRole: null,
    mentorApplicationStatus: 'not_requested',
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
  const updates: FirestoreUserData = {
    role,
    pendingRole: null,
  };

  if (role === 'mentor') {
    updates.mentorApplicationStatus = 'approved';
  } else {
    updates.mentorApplicationStatus = role === 'student' ? 'not_requested' : undefined;
    updates.mentorApplicationSubmittedAt = undefined;
  }

  await setDoc(userDocRef(userId), removeUndefinedFields(updates) ?? {}, { merge: true });

  if (currentUser && currentUser.id === userId) {
    currentUser = {
      ...currentUser,
      role,
      pendingRole: null,
      mentorApplicationStatus: updates.mentorApplicationStatus ?? currentUser.mentorApplicationStatus,
    };
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
  if (typeof updates.pendingRole === 'string' || updates.pendingRole === null) {
    allowedUpdates.pendingRole = updates.pendingRole === 'mentor' ? 'mentor' : null;
  }
  if (typeof updates.mentorApplicationStatus === 'string') {
    const allowedStatuses: MentorApplicationStatus[] = [
      'not_requested',
      'draft',
      'submitted',
      'approved',
      'rejected',
    ];
    if (allowedStatuses.includes(updates.mentorApplicationStatus as MentorApplicationStatus)) {
      allowedUpdates.mentorApplicationStatus = updates.mentorApplicationStatus as MentorApplicationStatus;
    }
  }
  if (typeof updates.mentorApplicationSubmittedAt === 'string') {
    allowedUpdates.mentorApplicationSubmittedAt = updates.mentorApplicationSubmittedAt;
  }
  if (typeof updates.mentorApplicationAdminNotes === 'string') {
    allowedUpdates.mentorApplicationAdminNotes = updates.mentorApplicationAdminNotes;
  }
  if (typeof updates.mentorApplicationAppealText === 'string') {
    allowedUpdates.mentorApplicationAppealText = updates.mentorApplicationAppealText;
  }
  if (typeof updates.mentorApplicationAppealSubmittedAt === 'string') {
    allowedUpdates.mentorApplicationAppealSubmittedAt = updates.mentorApplicationAppealSubmittedAt;
  }
  if (Array.isArray(updates.interests)) allowedUpdates.interests = updates.interests;
  if (Array.isArray(updates.learningDifferences)) {
    allowedUpdates.learningDifferences = updates.learningDifferences;
  }
  if (typeof updates.onboardingCompleted === 'boolean') {
    allowedUpdates.onboardingCompleted = updates.onboardingCompleted;
  }
  if (updates.studentProfile) {
    allowedUpdates.studentProfile = updates.studentProfile;
  }
  if (updates.mentorProfile) {
    allowedUpdates.mentorProfile = updates.mentorProfile;
  }
  if (typeof updates.accountSuspended === 'boolean') {
    allowedUpdates.accountSuspended = updates.accountSuspended;
  }
  if (typeof updates.suspensionReason === 'string') {
    allowedUpdates.suspensionReason = updates.suspensionReason;
  }
  if (typeof updates.messagingDisabled === 'boolean') {
    allowedUpdates.messagingDisabled = updates.messagingDisabled;
  }
  if (typeof updates.mentorMatchingDisabled === 'boolean') {
    allowedUpdates.mentorMatchingDisabled = updates.mentorMatchingDisabled;
  }

  const cleanedUpdates = removeUndefinedFields(allowedUpdates);

  if (cleanedUpdates && Object.keys(cleanedUpdates).length > 0) {
    await setDoc(userDocRef(userId), cleanedUpdates, { merge: true });
  }

  const snapshot = await getDoc(userDocRef(userId));
  const data = snapshot.exists() ? (snapshot.data() as FirestoreUserData) : {};
  const fallback = auth.currentUser && auth.currentUser.uid === userId ? auth.currentUser : null;

  currentUser = buildUserFromData(userId, data, fallback);
  return currentUser;
};
