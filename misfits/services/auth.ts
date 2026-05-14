import {
  User as FirebaseUser,
  onAuthStateChanged,
  updateProfile,
  MultiFactorResolver,
  TotpMultiFactorGenerator,
  TotpSecret,
  getMultiFactorResolver,
  deleteUser,
  sendEmailVerification,
  multiFactor,
} from 'firebase/auth';
import { doc, FieldValue, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from './firebase';
import { MentorApplicationStatus, User, UserRole } from '../types';
import {
  MAX_LENGTHS,
  sanitizeEmail,
  sanitizeMultiline,
  sanitizeOptional,
  sanitizeTagList,
  sanitizeText,
} from '../utils/sanitize';
import {
  linkPendingGoogleCredential,
  loginWithEmail as loginWithEmailService,
  loginWithGoogle as loginWithGoogleService,
  loginWithGoogleIdToken as loginWithGoogleIdTokenService,
  loginWithAppleIdToken as loginWithAppleIdTokenService,
  logout as logoutService,
  registerWithEmail as registerWithEmailService,
  sendPasswordReset as sendPasswordResetService,
} from './authService';

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
  ageVerifiedAt?: FieldValue;
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
      ageVerifiedAt: serverTimestamp(),
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
        console.error('Failed to fetch user profile:', error instanceof Error ? error.message : 'Unknown error');
        callback(null);
      });
  });
};

export const login = async (data: LoginData): Promise<User> => {
  try {
    const credential = await loginWithEmailService(data.email, data.password);
    currentUser = await fetchUserProfile(credential.user);
    // If user previously tried Google sign-in with this email, merge the accounts now
    await linkPendingGoogleCredential();
    return currentUser;
  } catch (error: any) {
    if (error?.code === 'auth/multi-factor-auth-required') {
      const resolver = getMultiFactorResolver(auth, error);
      throw { code: 'auth/multi-factor-auth-required', resolver };
    }
    throw error;
  }
};

export const loginWithGoogleAccount = async (): Promise<User> => {
  try {
    const credential = await loginWithGoogleService();
    currentUser = await fetchUserProfile(credential.user);
    return currentUser;
  } catch (error: any) {
    if (error?.code === 'auth/multi-factor-auth-required') {
      const resolver = getMultiFactorResolver(auth, error);
      throw { code: 'auth/multi-factor-auth-required', resolver };
    }
    throw error;
  }
};

export const loginWithGoogleNative = async (idToken: string): Promise<User> => {
  try {
    const credential = await loginWithGoogleIdTokenService(idToken);
    currentUser = await fetchUserProfile(credential.user);
    return currentUser;
  } catch (error: any) {
    if (error?.code === 'auth/multi-factor-auth-required') {
      const resolver = getMultiFactorResolver(auth, error);
      throw { code: 'auth/multi-factor-auth-required', resolver };
    }
    throw error;
  }
};

export const loginWithAppleNative = async (
  identityToken: string,
  rawNonce: string,
  fullName?: string,
): Promise<User> => {
  try {
    const credential = await loginWithAppleIdTokenService(identityToken, rawNonce);
    const firebaseUser = credential.user;

    // Apple only provides the user's name on the very first sign-in.
    // If Firebase didn't populate displayName yet and we have a name, set it now
    // so fetchUserProfile can write it into Firestore for new users.
    if (fullName && !firebaseUser.displayName) {
      try {
        await updateProfile(firebaseUser, { displayName: fullName });
      } catch {
        // Non-fatal — profile will just lack a display name
      }
    }

    currentUser = await fetchUserProfile(firebaseUser);
    return currentUser;
  } catch (error: any) {
    if (error?.code === 'auth/multi-factor-auth-required' && error?.resolver) {
      const resolver = getMultiFactorResolver(auth, error);
      throw { code: 'auth/multi-factor-auth-required', resolver };
    }
    throw error;
  }
};

export const signUp = async (data: SignUpData): Promise<User> => {
  const safeName = sanitizeText(data.name, MAX_LENGTHS.name);
  const safeEmail = sanitizeEmail(data.email);
  if (!safeEmail) {
    throw new Error('Please enter a valid email address.');
  }
  if (!safeName) {
    throw new Error('Please enter your name.');
  }
  if (typeof data.password !== 'string' || data.password.length === 0) {
    throw new Error('Please enter a password.');
  }
  if (data.password.length > MAX_LENGTHS.password) {
    throw new Error(`Password must be ${MAX_LENGTHS.password} characters or fewer.`);
  }

  const credential = await registerWithEmailService(safeEmail, data.password);

  try {
    await updateProfile(credential.user, { displayName: safeName });
  } catch (error) {
    console.warn('Failed to set display name', error);
  }

  const newUserData: FirestoreUserData = {
    name: safeName,
    email: safeEmail,
    role: null,
    onboardingCompleted: false,
    pendingRole: null,
    mentorApplicationStatus: 'not_requested',
    ageVerifiedAt: serverTimestamp(),
  };

  try {
    await setDoc(userDocRef(credential.user.uid), newUserData, { merge: true });
  } catch (error) {
    try {
      await deleteUser(credential.user);
    } catch (cleanupError) {
      console.error('Failed to delete orphaned auth user after signup error:', cleanupError instanceof Error ? cleanupError.message : 'Unknown error');
    }
    throw error;
  }

  try {
    await sendEmailVerification(credential.user);
  } catch (error) {
    console.warn('Failed to send verification email:', error instanceof Error ? error.message : 'Unknown error');
  }

  currentUser = buildUserFromData(credential.user.uid, newUserData, credential.user);
  return currentUser;
};

export const logout = async (): Promise<void> => {
  await logoutService();
  currentUser = null;
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetService(email);
};

export const getCurrentUser = (): User | null => currentUser;

export const completeMfaSignIn = async (
  resolver: MultiFactorResolver,
  code: string,
): Promise<void> => {
  const enrollmentId = resolver.hints[0]?.uid;
  if (!enrollmentId) throw new Error('No MFA enrollment found.');
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(enrollmentId, code);
  const userCredential = await resolver.resolveSignIn(assertion);
  currentUser = await fetchUserProfile(userCredential.user);
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  const callerUid = auth.currentUser?.uid;
  if (!callerUid || callerUid !== userId) {
    throw new Error('Unauthorized: you may only update your own role.');
  }

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

const sanitizeStudentProfile = (profile: User['studentProfile']): User['studentProfile'] => {
  if (!profile) return profile;
  return {
    ...profile,
    fullName: sanitizeText(profile.fullName ?? '', MAX_LENGTHS.name),
    locationCity: sanitizeText(profile.locationCity ?? '', MAX_LENGTHS.city),
    locationState: sanitizeText(profile.locationState ?? '', MAX_LENGTHS.state),
    timezone: sanitizeOptional(profile.timezone, MAX_LENGTHS.shortLine),
    supportGoalsOther: sanitizeOptional(profile.supportGoalsOther, MAX_LENGTHS.bio, true),
    preferredCommunicationNotes: sanitizeOptional(
      profile.preferredCommunicationNotes,
      MAX_LENGTHS.bio,
      true,
    ),
    strengthsText: sanitizeOptional(profile.strengthsText, MAX_LENGTHS.bio, true),
    challengesText: sanitizeOptional(profile.challengesText, MAX_LENGTHS.bio, true),
  };
};

const sanitizeMentorProfile = (profile: User['mentorProfile']): User['mentorProfile'] => {
  if (!profile) return profile;
  return {
    ...profile,
    fullName: sanitizeText(profile.fullName ?? '', MAX_LENGTHS.name),
    locationCity: sanitizeText(profile.locationCity ?? '', MAX_LENGTHS.city),
    locationState: sanitizeText(profile.locationState ?? '', MAX_LENGTHS.state),
    timezone: sanitizeOptional(profile.timezone, MAX_LENGTHS.shortLine),
    currentRole: sanitizeText(profile.currentRole ?? '', MAX_LENGTHS.role),
    expertiseAreas: sanitizeTagList(profile.expertiseAreas, 25, MAX_LENGTHS.shortLine),
    shortBio: sanitizeOptional(profile.shortBio, MAX_LENGTHS.bio, true),
    funFact: sanitizeOptional(profile.funFact, MAX_LENGTHS.shortLine),
  };
};

export const getMfaEnrolledFactors = (): { uid: string; displayName: string | null }[] => {
  const user = auth.currentUser;
  if (!user) return [];
  return multiFactor(user).enrolledFactors.map(f => ({ uid: f.uid, displayName: f.displayName ?? null }));
};

export const startMfaEnrollment = async (): Promise<{ secret: TotpSecret; qrCodeUrl: string }> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to enroll two-factor authentication.');

  const session = await multiFactor(user).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  const qrCodeUrl = secret.generateQrCodeUrl(user.email ?? user.uid, 'The Misfits Project');
  return { secret, qrCodeUrl };
};

export const completeMfaEnrollment = async (
  secret: TotpSecret,
  code: string,
  displayName = 'Authenticator',
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to enroll two-factor authentication.');

  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code);
  await multiFactor(user).enroll(assertion, displayName);
};

export const unenrollMfa = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to remove two-factor authentication.');

  const factors = multiFactor(user).enrolledFactors;
  if (factors.length === 0) throw new Error('No two-factor authentication method is enrolled.');
  await multiFactor(user).unenroll(factors[0]);
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>,
): Promise<User> => {
  const callerUid = auth.currentUser?.uid;
  if (!callerUid || callerUid !== userId) {
    throw new Error('Unauthorized: you may only update your own profile.');
  }

  try {
    const allowedUpdates: FirestoreUserData = {};

    if (typeof updates.name === 'string') {
      allowedUpdates.name = sanitizeText(updates.name, MAX_LENGTHS.name);
    }
    if (typeof updates.email === 'string') {
      const safeEmail = sanitizeEmail(updates.email);
      if (safeEmail) allowedUpdates.email = safeEmail;
    }
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
      allowedUpdates.mentorApplicationAdminNotes = sanitizeMultiline(
        updates.mentorApplicationAdminNotes,
        MAX_LENGTHS.notes,
      );
    }
    if (typeof updates.mentorApplicationAppealText === 'string') {
      allowedUpdates.mentorApplicationAppealText = sanitizeMultiline(
        updates.mentorApplicationAppealText,
        MAX_LENGTHS.notes,
      );
    }
    if (typeof updates.mentorApplicationAppealSubmittedAt === 'string') {
      allowedUpdates.mentorApplicationAppealSubmittedAt = updates.mentorApplicationAppealSubmittedAt;
    }
    if (Array.isArray(updates.interests)) {
      allowedUpdates.interests = sanitizeTagList(updates.interests, 50, MAX_LENGTHS.shortLine);
    }
    if (Array.isArray(updates.learningDifferences)) {
      allowedUpdates.learningDifferences = sanitizeTagList(
        updates.learningDifferences,
        50,
        MAX_LENGTHS.shortLine,
      );
    }
    if (typeof updates.onboardingCompleted === 'boolean') {
      allowedUpdates.onboardingCompleted = updates.onboardingCompleted;
    }
    if (updates.studentProfile) {
      allowedUpdates.studentProfile = sanitizeStudentProfile(updates.studentProfile);
    }
    if (updates.mentorProfile) {
      allowedUpdates.mentorProfile = sanitizeMentorProfile(updates.mentorProfile);
    }
    // accountSuspended, suspensionReason, messagingDisabled, mentorMatchingDisabled
    // are admin-only fields. Users cannot set them through this function.
    // Changes to those fields go through the admin service (admin SDK only).

    const cleanedUpdates = removeUndefinedFields(allowedUpdates);

    if (cleanedUpdates && Object.keys(cleanedUpdates).length > 0) {
      await setDoc(userDocRef(userId), cleanedUpdates, { merge: true });
    } else {
      console.warn('No valid updates to apply');
    }

    const snapshot = await getDoc(userDocRef(userId));
    const data = snapshot.exists() ? (snapshot.data() as FirestoreUserData) : {};
    const fallback = auth.currentUser && auth.currentUser.uid === userId ? auth.currentUser : null;

    currentUser = buildUserFromData(userId, data, fallback);
    return currentUser;
  } catch (error) {
    console.error('Error updating user profile:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};
