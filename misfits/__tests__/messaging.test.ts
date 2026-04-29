/**
 * Messaging system audit tests
 *
 * Scenarios:
 *  (1) Participant-only access – a user can only interact with threads they belong to
 *  (2) XSS / sanitization – messages are stripped before storage
 *  (3) Real-time delivery – subscribeToMessages uses onSnapshot and cleans up
 *  (4) Push notification wiring – reportMessage stores valid report documents
 *  (5) Message reporting – reportMessage stores a valid report; bad params throw
 *
 * Firebase SDK is mocked entirely so no real network calls are made.
 */

// ─── Firestore mock ──────────────────────────────────────────────────────────
const mockAddDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
const mockOnSnapshot = jest.fn();
const mockCollection = jest.fn((...args: unknown[]) => ({ _path: (args as string[]).join('/') }));
const mockDoc = jest.fn((...args: unknown[]) => ({ _path: (args as string[]).join('/') }));
const mockQuery = jest.fn((...args: unknown[]) => ({ _query: args }));
const mockWhere = jest.fn((...args: unknown[]) => ({ _where: args }));
const mockOrderBy = jest.fn((...args: unknown[]) => ({ _orderBy: args }));
const mockLimit = jest.fn((n: number) => ({ _limit: n }));

jest.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (n: number) => mockLimit(n),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  CollectionReference: jest.fn(),
  DocumentSnapshot: jest.fn(),
}));

// ─── Firebase / auth mocks ───────────────────────────────────────────────────
jest.mock('../services/firebase', () => ({ db: {} }));

const mockGetCurrentUser = jest.fn();
jest.mock('../services/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

// ─── Block module mock ───────────────────────────────────────────────────────
// These tests focus on messaging logic; block checks default to "no block".
// Specific block behaviour is covered in __tests__/profile-privacy.test.ts.
const mockIsEitherBlocked = jest.fn().mockResolvedValue(false);
jest.mock('../services/block', () => ({
  isEitherBlocked: (...a: unknown[]) => (mockIsEitherBlocked as any)(...a),
  blockUser: jest.fn(),
  unblockUser: jest.fn(),
  getBlockedByUser: jest.fn().mockResolvedValue([]),
  getBlockersOf: jest.fn().mockResolvedValue([]),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
import { sanitizeMultiline, sanitizeText, MAX_LENGTHS } from '../utils/sanitize';

// Import after all mocks are registered
import {
  sendMessage,
  startNewThread,
  reportMessage,
  subscribeToMessages,
} from '../services/messages';

// ─────────────────────────────────────────────────────────────────────────────

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-A',
  accountSuspended: false,
  messagingDisabled: false,
  ...overrides,
});

const makeThreadDoc = (participantIds = ['user-A', 'user-B']) => ({
  exists: () => true,
  id: 'thread-1',
  data: () => ({
    id: 'thread-1',
    participantIds,
    participantNames: ['Alice', 'Bob'],
    participants: {
      'user-A': { id: 'user-A', name: 'Alice' },
      'user-B': { id: 'user-B', name: 'Bob' },
    },
    participantKey: [...participantIds].sort().join('__'),
    lastMessage: 'hi',
    lastMessageTime: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }),
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCurrentUser.mockReturnValue(makeUser());
});

// =============================================================================
// (1) PARTICIPANT-ONLY ACCESS
// =============================================================================
describe('Scenario 1 – participant-only access', () => {
  it('sendMessage throws when fromUserId does not match the signed-in user', async () => {
    // The signed-in user is 'user-A' but the caller passes 'user-X'
    mockGetCurrentUser.mockReturnValue(makeUser({ id: 'user-A' }));
    await expect(sendMessage('thread-1', 'user-X', 'user-B', 'hello')).rejects.toThrow(
      'You must be signed in to send messages.',
    );
  });

  it('sendMessage throws when fromUserId is missing', async () => {
    await expect(sendMessage('thread-1', '', 'user-B', 'hello')).rejects.toThrow(
      'Invalid message parameters',
    );
  });

  it('startNewThread: findExistingThread query includes participantIds array-contains filter', async () => {
    // Returning empty so a new thread is created; we inspect the where() calls
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    mockAddDoc.mockResolvedValue({ id: 'new-thread' });

    await startNewThread('user-A', 'Alice', 'user-B', 'Bob', 'hello');

    // where() must have been called with 'participantIds', 'array-contains', currentUserId
    const participantWhereCall = mockWhere.mock.calls.find(
      (call: unknown[]) =>
        call[0] === 'participantIds' && call[1] === 'array-contains',
    );
    expect(participantWhereCall).toBeTruthy();
    expect(participantWhereCall![2]).toBe('user-A');
  });

  it('startNewThread: findExistingThread query also filters by participantKey', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    mockAddDoc.mockResolvedValue({ id: 'new-thread' });

    await startNewThread('user-A', 'Alice', 'user-B', 'Bob', 'hello');

    const keyWhereCall = mockWhere.mock.calls.find(
      (call: unknown[]) => call[0] === 'participantKey' && call[1] === '==',
    );
    expect(keyWhereCall).toBeTruthy();
    // participantKey is sorted('user-A','user-B').join('__')
    expect(keyWhereCall![2]).toBe('user-A__user-B');
  });

  it('sendMessage throws when account is suspended', async () => {
    mockGetCurrentUser.mockReturnValue(makeUser({ accountSuspended: true }));
    await expect(sendMessage('thread-1', 'user-A', 'user-B', 'hi')).rejects.toThrow(
      'Your account is suspended',
    );
  });

  it('sendMessage throws when messaging is disabled', async () => {
    mockGetCurrentUser.mockReturnValue(makeUser({ messagingDisabled: true }));
    await expect(sendMessage('thread-1', 'user-A', 'user-B', 'hi')).rejects.toThrow(
      'Messaging has been disabled',
    );
  });
});

// =============================================================================
// (2) XSS / SANITIZATION
// =============================================================================
describe('Scenario 2 – sanitization before storage', () => {
  it('strips HTML tags from message text', () => {
    const raw = '<script>alert("xss")</script>Hello';
    const safe = sanitizeMultiline(raw, MAX_LENGTHS.message);
    expect(safe).not.toContain('<script>');
    expect(safe).toContain('Hello');
  });

  it('escapes > that is not consumed by tag stripping', () => {
    // <b> and </b> are stripped; the standalone > in '5 > 3' survives and is escaped
    const raw = '5 > 3 and <b>bold</b>';
    const safe = sanitizeMultiline(raw, MAX_LENGTHS.message);
    expect(safe).not.toContain('<b>');
    expect(safe).toContain('&gt;');
    expect(safe).toContain('bold');
  });

  it('escapes a standalone < that is not part of an HTML tag', () => {
    // No closing >, so the regex /<[^>]*>/ does not match and < survives to be escaped
    const raw = 'score < 100';
    const safe = sanitizeMultiline(raw, MAX_LENGTHS.message);
    expect(safe).toContain('&lt;');
    expect(safe).not.toContain('<');
  });

  it('enforces MAX_LENGTHS.message (1000 chars) on message text', () => {
    const long = 'a'.repeat(1500);
    const safe = sanitizeMultiline(long, MAX_LENGTHS.message);
    expect(safe.length).toBe(MAX_LENGTHS.message);
  });

  it('sendMessage sanitizes the text before writing to Firestore', async () => {
    const threadRef = { id: 'thread-1', _path: 'threads/thread-1' };
    mockDoc.mockReturnValue(threadRef);
    mockCollection.mockReturnValue({ _path: 'threads/thread-1/messages' });
    mockAddDoc.mockResolvedValue({ id: 'msg-1' });
    mockUpdateDoc.mockResolvedValue(undefined);

    const xssPayload = '<img src=x onerror=alert(1)> hi';
    await sendMessage('thread-1', 'user-A', 'user-B', xssPayload);

    const [, messagePayload] = mockAddDoc.mock.calls[0];
    expect(messagePayload.text).not.toContain('<img');
    expect(messagePayload.text).toContain('hi');
  });

  it('sendMessage rejects an empty message after sanitization', async () => {
    await expect(sendMessage('thread-1', 'user-A', 'user-B', '   ')).rejects.toThrow(
      'Message cannot be empty',
    );
  });

  it('strips HTML from participant names in startNewThread', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    mockAddDoc
      .mockResolvedValueOnce({ id: 'thread-new' }) // thread
      .mockResolvedValueOnce({ id: 'msg-new' });   // initial message

    await startNewThread('user-A', '<b>Alice</b>', 'user-B', 'Bob', 'hi');

    const [, threadPayload] = mockAddDoc.mock.calls[0];
    expect(threadPayload.participantNames[0]).not.toContain('<b>');
  });
});

// =============================================================================
// (3) REAL-TIME DELIVERY
// =============================================================================
describe('Scenario 3 – real-time delivery via onSnapshot', () => {
  it('subscribeToMessages calls onSnapshot (not getDocs)', () => {
    const unsubMock = jest.fn();
    mockOnSnapshot.mockReturnValue(unsubMock);

    const unsubscribe = subscribeToMessages('thread-1', jest.fn(), jest.fn());

    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(typeof unsubscribe).toBe('function');
  });

  it('subscribeToMessages returns the unsubscribe function from onSnapshot', () => {
    const realUnsub = jest.fn();
    mockOnSnapshot.mockReturnValue(realUnsub);

    const unsubscribe = subscribeToMessages('thread-1', jest.fn(), jest.fn());
    unsubscribe();

    expect(realUnsub).toHaveBeenCalledTimes(1);
  });

  it('onUpdate callback receives mapped messages from snapshot docs', () => {
    const fakeDoc = {
      id: 'msg-1',
      data: () => ({
        fromUserId: 'user-A',
        toUserId: 'user-B',
        text: 'hello',
        timestamp: '2024-01-01T00:00:00Z',
      }),
    };
    mockOnSnapshot.mockImplementation((_q: unknown, onNext: Function) => {
      onNext({ docs: [fakeDoc] });
      return jest.fn();
    });

    const onUpdate = jest.fn();
    subscribeToMessages('thread-1', onUpdate, jest.fn());

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [messages] = onUpdate.mock.calls[0];
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ id: 'msg-1', text: 'hello' });
  });

  it('onError callback is called when onSnapshot emits an error', () => {
    mockOnSnapshot.mockImplementation((_q: unknown, _onNext: unknown, onError: Function) => {
      onError(new Error('permission-denied'));
      return jest.fn();
    });

    const onError = jest.fn();
    subscribeToMessages('thread-1', jest.fn(), onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('messages are sorted by timestamp ascending in onUpdate output', () => {
    const docs = [
      {
        id: 'msg-2',
        data: () => ({
          fromUserId: 'user-B',
          toUserId: 'user-A',
          text: 'second',
          timestamp: '2024-01-01T00:02:00Z',
        }),
      },
      {
        id: 'msg-1',
        data: () => ({
          fromUserId: 'user-A',
          toUserId: 'user-B',
          text: 'first',
          timestamp: '2024-01-01T00:01:00Z',
        }),
      },
    ];
    mockOnSnapshot.mockImplementation((_q: unknown, onNext: Function) => {
      onNext({ docs });
      return jest.fn();
    });

    const onUpdate = jest.fn();
    subscribeToMessages('thread-1', onUpdate, jest.fn());

    const [messages] = onUpdate.mock.calls[0];
    expect(messages[0].text).toBe('first');
    expect(messages[1].text).toBe('second');
  });
});

// =============================================================================
// (4) PUSH NOTIFICATIONS – token storage
// =============================================================================
describe('Scenario 4 – push notification token storage', () => {
  // The Cloud Function itself runs server-side and cannot be unit-tested here,
  // but we can verify the client-side savePushToken writes the correct field.
  it('savePushToken calls updateDoc with the pushToken field', async () => {
    const { savePushToken } = await import('../services/notifications');
    mockUpdateDoc.mockResolvedValue(undefined);

    await savePushToken('user-A', 'ExponentPushToken[xxxx]');

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, updates] = mockUpdateDoc.mock.calls[0];
    expect(updates).toEqual({ pushToken: 'ExponentPushToken[xxxx]' });
  });

  it('savePushToken is a no-op when userId is empty', async () => {
    const { savePushToken } = await import('../services/notifications');
    await savePushToken('', 'some-token');
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('savePushToken is a no-op when token is empty', async () => {
    const { savePushToken } = await import('../services/notifications');
    await savePushToken('user-A', '');
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('clearPushToken sets pushToken to empty string', async () => {
    const { clearPushToken } = await import('../services/notifications');
    mockUpdateDoc.mockResolvedValue(undefined);

    await clearPushToken('user-A');

    const [, updates] = mockUpdateDoc.mock.calls[0];
    expect(updates).toEqual({ pushToken: '' });
  });
});

// =============================================================================
// (5) MESSAGE REPORTING
// =============================================================================
describe('Scenario 5 – message reporting', () => {
  it('reportMessage writes a document to the reports collection', async () => {
    mockAddDoc.mockResolvedValue({ id: 'report-1' });

    await reportMessage('thread-1', 'msg-1', 'user-A', 'Inappropriate content');

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const [, reportPayload] = mockAddDoc.mock.calls[0];
    expect(reportPayload).toMatchObject({
      threadId: 'thread-1',
      messageId: 'msg-1',
      reportedById: 'user-A',
      status: 'pending',
    });
  });

  it('reportMessage sanitizes the reason field', async () => {
    mockAddDoc.mockResolvedValue({ id: 'report-2' });

    const maliciousReason = '<script>evil()</script>bad content';
    await reportMessage('thread-1', 'msg-1', 'user-A', maliciousReason);

    const [, payload] = mockAddDoc.mock.calls[0];
    expect(payload.reason).not.toContain('<script>');
    expect(payload.reason).toContain('bad content');
  });

  it('reportMessage falls back to "No reason provided" for empty reason', async () => {
    mockAddDoc.mockResolvedValue({ id: 'report-3' });

    await reportMessage('thread-1', 'msg-1', 'user-A', '');

    const [, payload] = mockAddDoc.mock.calls[0];
    expect(payload.reason).toBe('No reason provided');
  });

  it('reportMessage throws for missing threadId', async () => {
    await expect(reportMessage('', 'msg-1', 'user-A', 'reason')).rejects.toThrow(
      'Invalid report parameters',
    );
  });

  it('reportMessage throws for missing messageId', async () => {
    await expect(reportMessage('thread-1', '', 'user-A', 'reason')).rejects.toThrow(
      'Invalid report parameters',
    );
  });

  it('reportMessage throws when account is suspended', async () => {
    mockGetCurrentUser.mockReturnValue(makeUser({ accountSuspended: true }));
    await expect(
      reportMessage('thread-1', 'msg-1', 'user-A', 'reason'),
    ).rejects.toThrow('Your account is suspended');
  });

  it('reportMessage includes a timestamp in the report document', async () => {
    mockAddDoc.mockResolvedValue({ id: 'report-4' });

    const before = new Date().toISOString();
    await reportMessage('thread-1', 'msg-1', 'user-A', 'test');
    const after = new Date().toISOString();

    const [, payload] = mockAddDoc.mock.calls[0];
    expect(new Date(payload.timestamp) >= new Date(before)).toBe(true);
    expect(new Date(payload.timestamp) <= new Date(after)).toBe(true);
  });
});
