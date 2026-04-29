import type { MultiFactorResolver } from 'firebase/auth';

// ----- firebase/auth mock -----

const mockEnrolledFactors: { uid: string; displayName: string | null }[] = [];
const mockMultiFactorInstance = {
  getSession: jest.fn().mockResolvedValue({ session: 'mock-session' }),
  enrolledFactors: mockEnrolledFactors,
  enroll: jest.fn().mockResolvedValue(undefined),
  unenroll: jest.fn().mockResolvedValue(undefined),
};

const mockTotpSecret = {
  secretKey: 'JBSWY3DPEHPK3PXP',
  generateQrCodeUrl: jest.fn(
    (account: string, issuer: string) =>
      `otpauth://totp/${issuer}:${account}?secret=JBSWY3DPEHPK3PXP&issuer=${issuer}`,
  ),
};

const mockAssertion = { factorId: 'totp' };

const mockTotpMultiFactorGenerator = {
  generateSecret: jest.fn().mockResolvedValue(mockTotpSecret),
  assertionForEnrollment: jest.fn().mockReturnValue(mockAssertion),
  assertionForSignIn: jest.fn().mockReturnValue(mockAssertion),
};

jest.mock('firebase/auth', () => ({
  TotpMultiFactorGenerator: mockTotpMultiFactorGenerator,
  multiFactor: jest.fn(() => mockMultiFactorInstance),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  deleteUser: jest.fn(),
  sendEmailVerification: jest.fn(),
  getMultiFactorResolver: jest.fn(),
}));

// ----- firebase services mock -----

const mockCurrentUser = { uid: 'user-abc', email: 'test@example.com' };

jest.mock('../services/firebase', () => ({
  auth: { currentUser: mockCurrentUser },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'mock-doc-ref'),
  getDoc: jest.fn().mockResolvedValue({ exists: () => true, data: () => ({}) }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));

jest.mock('../services/authService', () => ({
  linkPendingGoogleCredential: jest.fn(),
  loginWithEmail: jest.fn(),
  loginWithGoogle: jest.fn(),
  loginWithGoogleIdToken: jest.fn(),
  logout: jest.fn(),
  registerWithEmail: jest.fn(),
  sendPasswordReset: jest.fn(),
  getPendingLinkEmail: jest.fn(),
}));

jest.mock('../utils/sanitize', () => ({
  MAX_LENGTHS: {
    name: 100, email: 254, password: 128, city: 100, state: 50,
    shortLine: 100, bio: 2000, notes: 5000, role: 100,
  },
  sanitizeEmail: jest.fn((v: string) => v),
  sanitizeText: jest.fn((v: string) => v),
  sanitizeMultiline: jest.fn((v: string) => v),
  sanitizeOptional: jest.fn((v: string) => v),
  sanitizeTagList: jest.fn((v: string[]) => v),
}));

// ----- tests -----

import {
  startMfaEnrollment,
  completeMfaEnrollment,
  completeMfaSignIn,
  getMfaEnrolledFactors,
  unenrollMfa,
} from '../services/auth';

beforeEach(() => {
  jest.clearAllMocks();
  mockEnrolledFactors.length = 0;
  mockMultiFactorInstance.getSession.mockResolvedValue({ session: 'mock-session' });
  mockTotpMultiFactorGenerator.generateSecret.mockResolvedValue(mockTotpSecret);
  mockTotpMultiFactorGenerator.assertionForEnrollment.mockReturnValue(mockAssertion);
  mockTotpMultiFactorGenerator.assertionForSignIn.mockReturnValue(mockAssertion);
  mockMultiFactorInstance.enroll.mockResolvedValue(undefined);
  mockMultiFactorInstance.unenroll.mockResolvedValue(undefined);
});

describe('startMfaEnrollment', () => {
  test('generates a TOTP secret and returns a qrCodeUrl', async () => {
    const result = await startMfaEnrollment();

    expect(mockMultiFactorInstance.getSession).toHaveBeenCalledTimes(1);
    expect(mockTotpMultiFactorGenerator.generateSecret).toHaveBeenCalledTimes(1);
    expect(mockTotpSecret.generateQrCodeUrl).toHaveBeenCalledWith(
      mockCurrentUser.email,
      'Misfits',
    );
    expect(result.secret).toBe(mockTotpSecret);
    expect(result.qrCodeUrl).toContain('otpauth://totp/');
    expect(result.qrCodeUrl).toContain(mockCurrentUser.email);
  });

  test('falls back to uid when user has no email', async () => {
    const { auth } = jest.requireMock('../services/firebase');
    const originalEmail = auth.currentUser.email;
    auth.currentUser = { uid: 'user-abc', email: null };

    await startMfaEnrollment();

    expect(mockTotpSecret.generateQrCodeUrl).toHaveBeenCalledWith('user-abc', 'Misfits');

    auth.currentUser = { uid: 'user-abc', email: originalEmail };
  });

  test('throws when no user is signed in', async () => {
    const { auth } = jest.requireMock('../services/firebase');
    const original = auth.currentUser;
    auth.currentUser = null;

    await expect(startMfaEnrollment()).rejects.toThrow(
      'Must be signed in to enroll two-factor authentication.',
    );

    auth.currentUser = original;
  });
});

describe('completeMfaEnrollment', () => {
  test('creates an assertion and enrolls the factor', async () => {
    await completeMfaEnrollment(mockTotpSecret as any, '123456');

    expect(mockTotpMultiFactorGenerator.assertionForEnrollment).toHaveBeenCalledWith(
      mockTotpSecret,
      '123456',
    );
    expect(mockMultiFactorInstance.enroll).toHaveBeenCalledWith(mockAssertion, 'Authenticator');
  });

  test('accepts a custom display name', async () => {
    await completeMfaEnrollment(mockTotpSecret as any, '654321', 'My Auth App');

    expect(mockMultiFactorInstance.enroll).toHaveBeenCalledWith(mockAssertion, 'My Auth App');
  });

  test('throws when no user is signed in', async () => {
    const { auth } = jest.requireMock('../services/firebase');
    const original = auth.currentUser;
    auth.currentUser = null;

    await expect(completeMfaEnrollment(mockTotpSecret as any, '123456')).rejects.toThrow(
      'Must be signed in to enroll two-factor authentication.',
    );

    auth.currentUser = original;
  });
});

describe('completeMfaSignIn', () => {
  const mockResolver = {
    hints: [{ uid: 'enrollment-id-1', factorId: 'totp', displayName: 'Authenticator' }],
    session: {},
    resolveSignIn: jest.fn().mockResolvedValue({
      user: { uid: 'user-abc', email: 'test@example.com' },
    }),
  } as unknown as MultiFactorResolver;

  test('creates a TOTP assertion using the enrollment id and resolves sign-in', async () => {
    await completeMfaSignIn(mockResolver, '123456');

    expect(mockTotpMultiFactorGenerator.assertionForSignIn).toHaveBeenCalledWith(
      'enrollment-id-1',
      '123456',
    );
    expect(mockResolver.resolveSignIn).toHaveBeenCalledWith(mockAssertion);
  });

  test('throws when the resolver has no hints', async () => {
    const emptyResolver = {
      hints: [],
      session: {},
      resolveSignIn: jest.fn(),
    } as unknown as MultiFactorResolver;

    await expect(completeMfaSignIn(emptyResolver, '123456')).rejects.toThrow(
      'No MFA enrollment found.',
    );
    expect(emptyResolver.resolveSignIn).not.toHaveBeenCalled();
  });
});

describe('getMfaEnrolledFactors', () => {
  test('returns empty array when no factors are enrolled', () => {
    const result = getMfaEnrolledFactors();
    expect(result).toEqual([]);
  });

  test('maps enrolled factors to uid and displayName', () => {
    mockEnrolledFactors.push(
      { uid: 'factor-1', displayName: 'Authenticator' },
      { uid: 'factor-2', displayName: null },
    );

    const result = getMfaEnrolledFactors();

    expect(result).toEqual([
      { uid: 'factor-1', displayName: 'Authenticator' },
      { uid: 'factor-2', displayName: null },
    ]);
  });
});

describe('unenrollMfa', () => {
  test('unenrolls the first enrolled factor', async () => {
    const factor = { uid: 'factor-1', displayName: 'Authenticator' };
    mockEnrolledFactors.push(factor as any);

    await unenrollMfa();

    expect(mockMultiFactorInstance.unenroll).toHaveBeenCalledWith(factor);
  });

  test('throws when no factors are enrolled', async () => {
    await expect(unenrollMfa()).rejects.toThrow(
      'No two-factor authentication method is enrolled.',
    );
  });

  test('throws when no user is signed in', async () => {
    const { auth } = jest.requireMock('../services/firebase');
    const original = auth.currentUser;
    auth.currentUser = null;

    await expect(unenrollMfa()).rejects.toThrow(
      'Must be signed in to remove two-factor authentication.',
    );

    auth.currentUser = original;
  });
});
