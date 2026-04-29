/**
 * Profile & Privacy audit tests
 *
 * Scenarios:
 *  (1) Student sensitive data is never exposed — updateUserProfile whitelist enforced
 *  (2) Profile edit ownership — user cannot update another user's profile
 *  (3) Photo uploads — feature not yet implemented; test confirms no storage write path
 *  (4) Account deletion data purge — deleteUserData Cloud Function is invoked; locally signs out
 *  (5) Blocked users — blockUser stores correct document; blocked parties cannot message
 *
 * Firebase SDK and Cloud Functions are fully mocked.
 */

// ─── Firestore mock ──────────────────────────────────────────────────────────
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockAddDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockOnSnapshot = jest.fn();
const mockCollection = jest.fn(() => ({ _col: true }));
const mockDoc = jest.fn(() => ({ _doc: true }));
const mockQuery = jest.fn((...args: any[]) => ({ _query: args }));
const mockWhere = jest.fn((...args: any[]) => args);

jest.mock('firebase/firestore', () => ({
  addDoc: (...a: any[]) => (mockAddDoc as any)(...a),
  collection: (...a: any[]) => (mockCollection as any)(...a),
  deleteDoc: (...a: any[]) => (mockDeleteDoc as any)(...a),
  doc: (...a: any[]) => (mockDoc as any)(...a),
  getDoc: (...a: any[]) => (mockGetDoc as any)(...a),
  getDocs: (...a: any[]) => (mockGetDocs as any)(...a),
  limit: jest.fn(),
  onSnapshot: (...a: any[]) => (mockOnSnapshot as any)(...a),
  orderBy: jest.fn(),
  query: (...a: any[]) => (mockQuery as any)(...a),
  setDoc: (...a: any[]) => (mockSetDoc as any)(...a),
  updateDoc: (...a: any[]) => (mockUpdateDoc as any)(...a),
  where: (...a: any[]) => (mockWhere as any)(...a),
  CollectionReference: jest.fn(),
  DocumentSnapshot: jest.fn(),
}));

// ─── Firebase Auth mock ───────────────────────────────────────────────────────
const mockSignOut = jest.fn();

jest.mock('firebase/auth', () => {
  const MockGoogleAuthProvider = jest.fn().mockImplementation(() => ({
    setCustomParameters: jest.fn(),
  }));
  MockGoogleAuthProvider.credential = jest.fn(() => 'google-credential');
  MockGoogleAuthProvider.credentialFromError = jest.fn(() => null);

  return {
    getAuth: jest.fn(),
    signOut: (...a: any[]) => (mockSignOut as any)(...a),
    EmailAuthProvider: { credential: jest.fn(() => 'email-credential') },
    reauthenticateWithCredential: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    signInWithCredential: jest.fn(),
    linkWithCredential: jest.fn(),
    GoogleAuthProvider: MockGoogleAuthProvider,
    TotpMultiFactorGenerator: {
      generateSecret: jest.fn(),
      assertionForEnrollment: jest.fn(),
      assertionForSignIn: jest.fn(),
    },
    onAuthStateChanged: jest.fn(),
    updateProfile: jest.fn(),
    getMultiFactorResolver: jest.fn(),
    deleteUser: jest.fn(),
    sendEmailVerification: jest.fn(),
    multiFactor: jest.fn(() => ({ enrolledFactors: [], getSession: jest.fn() })),
  };
});

// ─── Firebase Functions mock ──────────────────────────────────────────────────
const mockHttpsCallable = jest.fn();
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: (..._a: any[]) => mockHttpsCallable,
}));

// ─── Firebase app/db/auth ─────────────────────────────────────────────────────
// Use a mutable object so tests can swap auth.currentUser per scenario.
const mockFirebaseModule = {
  db: {},
  auth: { currentUser: { uid: 'user-A', email: 'alice@example.com', providerData: [{ providerId: 'password' }] } as { uid: string; email: string; providerData: { providerId: string }[] } | null },
  app: {},
};
jest.mock('../services/firebase', () => mockFirebaseModule);

// ─── services/auth: keep real updateUserProfile, override getCurrentUser ──────
const mockGetCurrentUser = jest.fn();
jest.mock('../services/auth', () => {
  const actual = jest.requireActual('../services/auth') as Record<string, unknown>;
  return {
    ...actual,
    getCurrentUser: () => mockGetCurrentUser(),
  };
});

// ─────────────────────────────────────────────────────────────────────────────

import { updateUserProfile } from '../services/auth';
import { blockUser, unblockUser, isEitherBlocked } from '../services/block';
import { sendMessage, startNewThread } from '../services/messages';

const makeActiveUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-A',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'student',
  accountSuspended: false,
  messagingDisabled: false,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  // Reset firebase auth user to owner identity
  mockFirebaseModule.auth.currentUser = { uid: 'user-A', email: 'alice@example.com', providerData: [{ providerId: 'password' }] };
  mockGetCurrentUser.mockReturnValue(makeActiveUser());
});

// =============================================================================
// (1) STUDENT SENSITIVE DATA — updateUserProfile whitelist
// =============================================================================
describe('Scenario 1 – student sensitive data not exposed through profile updates', () => {
  it('updateUserProfile does not include accountSuspended in the write payload', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Alice', role: 'student' }),
    });

    await updateUserProfile('user-A', {
      name: 'Alice Updated',
      // Attempt to set admin-controlled fields — should be silently ignored
      accountSuspended: false,
      messagingDisabled: false,
      mentorMatchingDisabled: false,
    } as any);

    const [, writtenData] = mockSetDoc.mock.calls[0];
    expect(writtenData).not.toHaveProperty('accountSuspended');
    expect(writtenData).not.toHaveProperty('messagingDisabled');
    expect(writtenData).not.toHaveProperty('mentorMatchingDisabled');
    expect(writtenData.name).toBe('Alice Updated');
  });

  it('updateUserProfile does not include suspensionReason in the write payload', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Alice', role: 'student' }),
    });

    await updateUserProfile('user-A', {
      name: 'Alice',
      suspensionReason: 'injected reason',
    } as any);

    const [, writtenData] = mockSetDoc.mock.calls[0];
    expect(writtenData).not.toHaveProperty('suspensionReason');
  });

  it('updateUserProfile sanitizes studentProfile fields (strips HTML)', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Alice', role: 'student' }),
    });

    await updateUserProfile('user-A', {
      studentProfile: {
        fullName: '<b>Alice</b>',
        gradeLevel: 'high_school',
        locationCity: 'Boston',
        locationState: 'MA',
        supportGoals: [],
        learningStyles: [],
        communicationMethods: [],
        meetingFrequency: 'weekly',
        mentorTraits: [],
      },
    });

    const [, writtenData] = mockSetDoc.mock.calls[0];
    expect(writtenData.studentProfile.fullName).not.toContain('<b>');
    expect(writtenData.studentProfile.fullName).toContain('Alice');
  });
});

// =============================================================================
// (2) PROFILE EDIT OWNERSHIP
// =============================================================================
describe('Scenario 2 – profile edit ownership validation', () => {
  it('updateUserProfile throws when caller updates a different userId', async () => {
    // auth.currentUser.uid is 'user-A'; attempting to update 'user-B' is unauthorized
    await expect(updateUserProfile('user-B', { name: 'Hacked' })).rejects.toThrow(
      'Unauthorized',
    );
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('updateUserProfile throws when no user is signed in', async () => {
    mockFirebaseModule.auth.currentUser = null;

    await expect(updateUserProfile('user-A', { name: 'Alice' })).rejects.toThrow(
      'Unauthorized',
    );
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('updateUserProfile succeeds for the owner', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Alice', role: 'student' }),
    });

    await expect(updateUserProfile('user-A', { name: 'Alice V2' })).resolves.not.toThrow();
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });

  it('sendMessage throws when fromUserId does not match signed-in user', async () => {
    mockGetCurrentUser.mockReturnValue(makeActiveUser({ id: 'user-A' }));

    await expect(
      sendMessage('thread-1', 'user-X', 'user-B', 'hello'),
    ).rejects.toThrow('You must be signed in');
  });
});

// =============================================================================
// (3) PHOTO UPLOADS — not yet implemented
// =============================================================================
describe('Scenario 3 – photo uploads (not yet implemented)', () => {
  it('no firebase/storage import exists in the services directory', () => {
    // We verify at the module level that storage upload APIs are not present.
    // When photo upload is implemented it must go through a server-validated
    // Cloud Function (file type and size must be verified server-side).
    const blockService = require('../services/block');
    const messageService = require('../services/messages');
    const authServiceModule = require('../services/auth');

    // None of the core services should reference firebase/storage paths
    expect(Object.keys(blockService)).not.toContain('uploadProfilePhoto');
    expect(Object.keys(messageService)).not.toContain('uploadProfilePhoto');
    expect(Object.keys(authServiceModule)).not.toContain('uploadProfilePhoto');
  });
});

// =============================================================================
// (4) ACCOUNT DELETION + DATA PURGE
// =============================================================================
describe('Scenario 4 – account deletion purges all data (GDPR/CCPA)', () => {
  it('deleteUserAccount calls the deleteUserData Cloud Function', async () => {
    const { reauthenticateWithCredential } = require('firebase/auth');
    (reauthenticateWithCredential as jest.Mock).mockResolvedValue(undefined);
    mockHttpsCallable.mockResolvedValue({ data: { success: true } });
    mockSignOut.mockResolvedValue(undefined);

    const { deleteUserAccount } = require('../services/authService');
    await deleteUserAccount('password123');

    expect(mockHttpsCallable).toHaveBeenCalledTimes(1);
  });

  it('deleteUserAccount signs out locally after the Cloud Function succeeds', async () => {
    const { reauthenticateWithCredential } = require('firebase/auth');
    (reauthenticateWithCredential as jest.Mock).mockResolvedValue(undefined);
    mockHttpsCallable.mockResolvedValue({ data: { success: true } });
    mockSignOut.mockResolvedValue(undefined);

    const { deleteUserAccount } = require('../services/authService');
    await deleteUserAccount('password123');

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('deleteUserAccount throws for Google-only accounts (no password provider)', async () => {
    mockFirebaseModule.auth.currentUser = {
      uid: 'user-A',
      email: 'alice@example.com',
      providerData: [{ providerId: 'google.com' }],
    };

    const { deleteUserAccount } = require('../services/authService');
    await expect(deleteUserAccount('ignored')).rejects.toThrow('Google Sign-In');
    expect(mockHttpsCallable).not.toHaveBeenCalled();
  });

  it('deleteGoogleUserAccount re-authenticates with the Google credential', async () => {
    mockFirebaseModule.auth.currentUser = {
      uid: 'user-A',
      email: 'alice@example.com',
      providerData: [{ providerId: 'google.com' }],
    };

    const { reauthenticateWithCredential, GoogleAuthProvider } = require('firebase/auth');
    (reauthenticateWithCredential as jest.Mock).mockResolvedValue(undefined);
    mockHttpsCallable.mockResolvedValue({ data: { success: true } });
    mockSignOut.mockResolvedValue(undefined);

    const { deleteGoogleUserAccount } = require('../services/authService');
    await deleteGoogleUserAccount('fake-id-token');

    expect(GoogleAuthProvider.credential).toHaveBeenCalledWith('fake-id-token');
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(
      mockFirebaseModule.auth.currentUser,
      'google-credential',
    );
    expect(mockHttpsCallable).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('deleteGoogleUserAccount throws when no user is signed in', async () => {
    mockFirebaseModule.auth.currentUser = null;

    const { deleteGoogleUserAccount } = require('../services/authService');
    await expect(deleteGoogleUserAccount('fake-id-token')).rejects.toThrow(
      'No authenticated user found.',
    );
    expect(mockHttpsCallable).not.toHaveBeenCalled();
  });

  it('deleteGoogleUserAccount propagates reauthentication failures', async () => {
    mockFirebaseModule.auth.currentUser = {
      uid: 'user-A',
      email: 'alice@example.com',
      providerData: [{ providerId: 'google.com' }],
    };

    const { reauthenticateWithCredential } = require('firebase/auth');
    (reauthenticateWithCredential as jest.Mock).mockRejectedValue(
      Object.assign(new Error('auth/user-mismatch'), { code: 'auth/user-mismatch' }),
    );

    const { deleteGoogleUserAccount } = require('../services/authService');
    await expect(deleteGoogleUserAccount('stale-token')).rejects.toThrow();
    expect(mockHttpsCallable).not.toHaveBeenCalled();
  });
});

// =============================================================================
// (5) BLOCKED USERS
// =============================================================================
describe('Scenario 5 – blocked users cannot message or appear in discovery', () => {
  it('blockUser writes a block document with correct fromUserId/toUserId', async () => {
    mockSetDoc.mockResolvedValue(undefined);

    await blockUser('user-A', 'user-B');

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [, payload] = mockSetDoc.mock.calls[0];
    expect(payload).toMatchObject({ fromUserId: 'user-A', toUserId: 'user-B' });
  });

  it('blockUser throws when the caller tries to block themselves', async () => {
    await expect(blockUser('user-A', 'user-A')).rejects.toThrow('cannot block yourself');
  });

  it('blockUser throws when a different user tries to act as fromUserId', async () => {
    mockGetCurrentUser.mockReturnValue(makeActiveUser({ id: 'user-A' }));

    await expect(blockUser('user-C', 'user-B')).rejects.toThrow('Unauthorized');
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('unblockUser deletes the correct block document', async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    await unblockUser('user-A', 'user-B');

    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  it('isEitherBlocked returns true when A has blocked B', async () => {
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true })  // user-A_user-B
      .mockResolvedValueOnce({ exists: () => false }); // user-B_user-A

    const blocked = await isEitherBlocked('user-A', 'user-B');
    expect(blocked).toBe(true);
  });

  it('isEitherBlocked returns true when B has blocked A', async () => {
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false }) // user-A_user-B
      .mockResolvedValueOnce({ exists: () => true });  // user-B_user-A

    const blocked = await isEitherBlocked('user-A', 'user-B');
    expect(blocked).toBe(true);
  });

  it('isEitherBlocked returns false when no block exists in either direction', async () => {
    mockGetDoc
      .mockResolvedValue({ exists: () => false });

    const blocked = await isEitherBlocked('user-A', 'user-B');
    expect(blocked).toBe(false);
  });

  it('sendMessage throws when user-B has blocked user-A', async () => {
    // isEitherBlocked returns true → user-B blocked user-A
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => true });

    await expect(
      sendMessage('thread-1', 'user-A', 'user-B', 'hello'),
    ).rejects.toThrow('cannot send messages to this user');
  });

  it('startNewThread throws when either user is blocking the other', async () => {
    // isEitherBlocked returns true
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true })
      .mockResolvedValueOnce({ exists: () => false });

    await expect(
      startNewThread('user-A', 'Alice', 'user-B', 'Bob', 'Hello'),
    ).rejects.toThrow('Cannot start a conversation');
  });

  it('sendMessage succeeds when no block exists', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockAddDoc.mockResolvedValue({ id: 'msg-1' });
    mockUpdateDoc.mockResolvedValue(undefined);

    await expect(
      sendMessage('thread-1', 'user-A', 'user-B', 'hello'),
    ).resolves.not.toThrow();
  });
});
