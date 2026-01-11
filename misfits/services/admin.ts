import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  DocumentData,
  DocumentSnapshot,
  CollectionReference,
} from 'firebase/firestore';

import { db } from './firebase';
import {
  MatchRecord,
  MatchStatus,
  MentorApplicationStatus,
  Message,
  MessageThread,
  SessionRecord,
  SessionStatus,
  ThreadParticipantProfile,
  User,
  UserRole,
} from '../types';

type UserDocument = DocumentData & {
  name?: string;
  email?: string;
  role?: UserRole | null;
  pendingRole?: UserRole | null;
  mentorApplicationStatus?: MentorApplicationStatus;
  mentorApplicationSubmittedAt?: string;
  mentorApplicationAdminNotes?: string;
  mentorApplicationAppealText?: string;
  mentorApplicationAppealSubmittedAt?: string;
  onboardingCompleted?: boolean;
  studentProfile?: User['studentProfile'];
  mentorProfile?: User['mentorProfile'];
  accountSuspended?: boolean;
  suspensionReason?: string;
};

const usersCollection = collection(db, 'users');

const mapUserDoc = (snapshot: DocumentSnapshot<UserDocument>): User => {
  const data = snapshot.data() || {};
  return {
    id: snapshot.id,
    name: data.name ?? '',
    email: data.email ?? '',
    role: typeof data.role === 'string' ? data.role : null,
    pendingRole: typeof data.pendingRole === 'string' ? data.pendingRole : null,
    mentorApplicationStatus: data.mentorApplicationStatus ?? 'not_requested',
    mentorApplicationSubmittedAt: data.mentorApplicationSubmittedAt,
    mentorApplicationAdminNotes: data.mentorApplicationAdminNotes,
    mentorApplicationAppealText: data.mentorApplicationAppealText,
    mentorApplicationAppealSubmittedAt: data.mentorApplicationAppealSubmittedAt,
    onboardingCompleted: data.onboardingCompleted ?? false,
    studentProfile: data.studentProfile,
    mentorProfile: data.mentorProfile,
    accountSuspended: data.accountSuspended ?? false,
    suspensionReason: data.suspensionReason,
  };
};

export const fetchAllUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(docSnap => mapUserDoc(docSnap as DocumentSnapshot<UserDocument>));
};

export const fetchPendingMentorApplications = async (): Promise<User[]> => {
  const pendingQuery = query(usersCollection, where('pendingRole', '==', 'mentor'));
  const snapshot = await getDocs(pendingQuery);

  const users = snapshot.docs.map(docSnap => mapUserDoc(docSnap as DocumentSnapshot<UserDocument>));

  return users.sort((a, b) => {
    const aTime = a.mentorApplicationSubmittedAt ?? '';
    const bTime = b.mentorApplicationSubmittedAt ?? '';
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
};

export const reviewMentorApplication = async (
  userId: string,
  params: {
    decision: 'approve' | 'reject';
    adminNotes?: string;
  },
): Promise<void> => {
  const userRef = doc(usersCollection, userId);
  if (params.decision === 'approve') {
    await updateDoc(userRef, {
      role: 'mentor',
      pendingRole: null,
      mentorApplicationStatus: 'approved',
      mentorApplicationAdminNotes: params.adminNotes ?? '',
      mentorApplicationAppealText: null,
      mentorApplicationAppealSubmittedAt: null,
    });
    return;
  }

  await updateDoc(userRef, {
    mentorApplicationStatus: 'rejected',
    mentorApplicationAdminNotes: params.adminNotes ?? '',
  });
};

export const updateUserSuspension = async (
  userId: string,
  suspend: boolean,
  reason?: string,
): Promise<void> => {
  const userRef = doc(usersCollection, userId);
  await updateDoc(userRef, {
    accountSuspended: suspend,
    suspensionReason: suspend ? reason ?? 'Suspended by administrator' : null,
  });
};

export const toggleUserMessaging = async (userId: string, disabled: boolean): Promise<void> => {
  const userRef = doc(usersCollection, userId);
  await updateDoc(userRef, {
    messagingDisabled: disabled,
  });
};

export const toggleMentorMatching = async (userId: string, disabled: boolean): Promise<void> => {
  const userRef = doc(usersCollection, userId);
  await updateDoc(userRef, {
    mentorMatchingDisabled: disabled,
  });
};

type ThreadDocument = MessageThread & {
  participantKey?: string;
  participants?: Record<string, ThreadParticipantProfile>;
};

const threadsCollection = collection(db, 'threads') as CollectionReference<ThreadDocument>;
const matchesCollection = collection(db, 'matches') as CollectionReference<MatchRecord>;
const sessionsCollection = collection(db, 'sessions') as CollectionReference<SessionRecord>;

const mapThreadDoc = (snapshot: DocumentSnapshot<ThreadDocument>): MessageThread => {
  const data = snapshot.data() as ThreadDocument;
  return {
    id: snapshot.id,
    participantIds: data.participantIds || [],
    participantNames: data.participantNames || [],
    participants: data.participants,
    participantKey: data.participantKey,
    lastMessage: data.lastMessage,
    lastMessageTime: data.lastMessageTime,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

export const fetchAllThreadsForAudit = async (): Promise<MessageThread[]> => {
  const snapshot = await getDocs(query(threadsCollection, orderBy('updatedAt', 'desc')));
  return snapshot.docs.map(docSnap => mapThreadDoc(docSnap));
};

export const fetchThreadMessagesForAudit = async (threadId: string): Promise<Message[]> => {
  if (!threadId) return [];
  const messagesCollection = collection(doc(threadsCollection, threadId), 'messages');
  const snapshot = await getDocs(query(messagesCollection, orderBy('timestamp', 'asc')));
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data() as Message;
    return {
      id: docSnap.id,
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      text: data.text,
      timestamp: data.timestamp,
      flaggedKeywords: data.flaggedKeywords,
      flaggedReviewed: data.flaggedReviewed,
      flaggedReviewedBy: data.flaggedReviewedBy,
    };
  });
};

export const markMessageReviewed = async (
  threadId: string,
  messageId: string,
  adminName: string,
): Promise<void> => {
  const messageRef = doc(collection(doc(threadsCollection, threadId), 'messages'), messageId);
  await updateDoc(messageRef, {
    flaggedReviewed: true,
    flaggedReviewedBy: adminName,
  });
};

const mapMatchDoc = (snapshot: DocumentSnapshot<MatchRecord>): MatchRecord => {
  const data = snapshot.data() as MatchRecord;
  return {
    id: snapshot.id,
    studentId: data.studentId,
    studentName: data.studentName,
    mentorId: data.mentorId,
    mentorName: data.mentorName,
    status: data.status || 'pending',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    notes: data.notes,
  };
};

export const fetchMatches = async (): Promise<MatchRecord[]> => {
  const snapshot = await getDocs(query(matchesCollection, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(docSnap => mapMatchDoc(docSnap as DocumentSnapshot<MatchRecord>));
};

export const createManualMatch = async (payload: {
  studentId: string;
  studentName?: string;
  mentorId: string;
  mentorName?: string;
  notes?: string;
}): Promise<void> => {
  const timestamp = new Date().toISOString();
  const newMatch: MatchRecord = {
    id: '',
    studentId: payload.studentId,
    studentName: payload.studentName,
    mentorId: payload.mentorId,
    mentorName: payload.mentorName,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    notes: payload.notes,
  };

  await addDoc(matchesCollection, newMatch);
};

export const updateMatchStatus = async (
  matchId: string,
  status: MatchStatus,
  notes?: string,
): Promise<void> => {
  const matchRef = doc(matchesCollection, matchId);
  await updateDoc(matchRef, {
    status,
    notes,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteMatch = async (matchId: string): Promise<void> => {
  const matchRef = doc(matchesCollection, matchId);
  await deleteDoc(matchRef);
};

const mapSessionDoc = (snapshot: DocumentSnapshot<SessionRecord>): SessionRecord => {
  const data = snapshot.data() as SessionRecord;
  return {
    id: snapshot.id,
    matchId: data.matchId,
    studentId: data.studentId,
    mentorId: data.mentorId,
    scheduledFor: data.scheduledFor,
    status: data.status || 'requested',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    topic: data.topic,
    notes: data.notes,
  };
};

export const fetchSessions = async (): Promise<SessionRecord[]> => {
  const snapshot = await getDocs(query(sessionsCollection, orderBy('scheduledFor', 'desc')));
  return snapshot.docs.map(docSnap => mapSessionDoc(docSnap as DocumentSnapshot<SessionRecord>));
};

export const updateSessionStatus = async (
  sessionId: string,
  status: SessionStatus,
  notes?: string,
): Promise<void> => {
  const sessionRef = doc(sessionsCollection, sessionId);
  await updateDoc(sessionRef, {
    status,
    notes,
    updatedAt: new Date().toISOString(),
  });
};
