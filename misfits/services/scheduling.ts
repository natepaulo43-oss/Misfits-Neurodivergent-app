import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  CollectionReference,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentUser } from './auth';
import { startNewThread } from './messages';
import {
  MentorAvailability,
  Session,
  SessionNote,
  WeeklyAvailabilityBlock,
  AvailabilityException,
  ConnectionPreference,
  RescheduleOption,
  TimeSlot,
} from '../types';
import { generateTimeSlots, getDeviceTimezone, getDateString } from '../utils/scheduling';

const availabilityCollection = collection(db, 'mentorAvailability') as CollectionReference<MentorAvailability>;
const sessionsCollection = collection(db, 'sessions') as CollectionReference<Session>;
const sessionNotesCollection = collection(db, 'sessionNotes') as CollectionReference<SessionNote>;

export const getMentorAvailability = async (mentorId: string): Promise<MentorAvailability | null> => {
  try {
    const availRef = doc(availabilityCollection, mentorId);
    const snapshot = await getDoc(availRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id,
    } as MentorAvailability;
  } catch (error) {
    console.error('[scheduling] Failed to fetch mentor availability', error);
    throw error instanceof Error ? error : new Error('Unable to load availability');
  }
};

export const saveMentorAvailability = async (
  mentorId: string,
  availability: Omit<MentorAvailability, 'id' | 'mentorId' | 'updatedAt'>,
): Promise<MentorAvailability> => {
  const currentUser = getCurrentUser();
  console.log('[scheduling] Current user:', currentUser);
  console.log('[scheduling] Mentor ID:', mentorId);
  console.log('[scheduling] User role:', currentUser?.role);
  console.log('[scheduling] Account suspended:', currentUser?.accountSuspended);
  
  if (!currentUser || currentUser.id !== mentorId) {
    throw new Error('Unauthorized');
  }
  
  if (currentUser.role !== 'mentor') {
    throw new Error('Only mentors can set availability');
  }
  
  const now = new Date().toISOString();
  const availabilityData: Omit<MentorAvailability, 'id'> = {
    mentorId,
    timezone: availability.timezone,
    sessionDurations: availability.sessionDurations,
    bufferMinutes: availability.bufferMinutes,
    maxSessionsPerDay: availability.maxSessionsPerDay,
    weeklyBlocks: availability.weeklyBlocks,
    exceptions: availability.exceptions,
    updatedAt: now,
  };
  
  try {
    const availRef = doc(availabilityCollection, mentorId);
    await setDoc(availRef, availabilityData);
    
    return {
      id: mentorId,
      ...availabilityData,
    };
  } catch (error) {
    console.error('[scheduling] Failed to save availability', error);
    throw error instanceof Error ? error : new Error('Unable to save availability');
  }
};

export const getAvailableSlots = async (
  mentorId: string,
  selectedDate: Date,
  durationMinutes: number,
): Promise<TimeSlot[]> => {
  try {
    const availability = await getMentorAvailability(mentorId);
    if (!availability) {
      return [];
    }
    
    const dateStr = getDateString(selectedDate);
    const sessionsQuery = query(
      sessionsCollection,
      where('mentorId', '==', mentorId),
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    const allSessions = sessionsSnapshot.docs.map(docSnap => ({
      ...docSnap.data(),
      id: docSnap.id,
    } as Session));
    
    const relevantSessions = allSessions.filter(session => {
      const sessionDate = getDateString(new Date(session.requestedStart));
      return sessionDate === dateStr;
    });
    
    return generateTimeSlots(availability, selectedDate, durationMinutes, relevantSessions);
  } catch (error) {
    console.error('[scheduling] Failed to get available slots', error);
    throw error instanceof Error ? error : new Error('Unable to load available slots');
  }
};

export const createSessionRequest = async (
  mentorId: string,
  slotStart: Date,
  slotEnd: Date,
  connectionPreference: ConnectionPreference,
  studentNotes?: string,
): Promise<Session> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be signed in');
  }
  
  if (currentUser.role !== 'student') {
    throw new Error('Only students can request sessions');
  }
  
  if (currentUser.accountSuspended) {
    throw new Error('Your account is suspended');
  }
  
  const now = new Date().toISOString();
  const studentTimezone = getDeviceTimezone();
  
  const mentorAvailability = await getMentorAvailability(mentorId);
  if (!mentorAvailability) {
    throw new Error('Mentor availability not found');
  }
  
  const sessionData: Omit<Session, 'id'> = {
    studentId: currentUser.id,
    mentorId,
    status: 'pending',
    requestedStart: slotStart.toISOString(),
    requestedEnd: slotEnd.toISOString(),
    studentTimezone,
    mentorTimezone: mentorAvailability.timezone,
    connectionPreference,
    studentNotes,
    createdAt: now,
    updatedAt: now,
    reminderState: {
      sent24h: false,
      sent1h: false,
    },
  };
  
  try {
    const sessionRef = await addDoc(sessionsCollection, sessionData);
    
    try {
      const mentorDoc = await getDoc(doc(db, 'users', mentorId));
      const mentorName = mentorDoc.exists() ? mentorDoc.data().name : 'Mentor';
      
      const thread = await startNewThread(
        currentUser.id,
        currentUser.name,
        mentorId,
        mentorName,
        `Hi! I've requested a session with you.`,
        { sendInitialMessageOnExisting: false }
      );
      
      await updateDoc(doc(sessionsCollection, sessionRef.id), {
        chatId: thread.id,
      });
      
      return {
        id: sessionRef.id,
        ...sessionData,
        chatId: thread.id,
      };
    } catch (threadError) {
      console.warn('[scheduling] Failed to create thread, continuing without chatId', threadError);
      return {
        id: sessionRef.id,
        ...sessionData,
      };
    }
  } catch (error) {
    console.error('[scheduling] Failed to create session request', error);
    throw error instanceof Error ? error : new Error('Unable to create session request');
  }
};

export const getSessionById = async (sessionId: string): Promise<Session | null> => {
  try {
    const sessionRef = doc(sessionsCollection, sessionId);
    const snapshot = await getDoc(sessionRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      ...snapshot.data(),
      id: snapshot.id,
    } as Session;
  } catch (error) {
    console.error('[scheduling] Failed to fetch session', error);
    throw error instanceof Error ? error : new Error('Unable to load session');
  }
};

export const getSessionsForUser = async (
  userId: string,
  role: 'student' | 'mentor',
): Promise<Session[]> => {
  try {
    const field = role === 'student' ? 'studentId' : 'mentorId';
    const sessionsQuery = query(
      sessionsCollection,
      where(field, '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(sessionsQuery);
    return snapshot.docs.map(docSnap => ({
      ...docSnap.data(),
      id: docSnap.id,
    } as Session));
  } catch (error) {
    console.error('[scheduling] Failed to fetch sessions', error);
    throw error instanceof Error ? error : new Error('Unable to load sessions');
  }
};

export const acceptSessionRequest = async (sessionId: string): Promise<Session> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be signed in');
  }
  
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.mentorId !== currentUser.id) {
    throw new Error('Unauthorized');
  }
  
  if (session.status !== 'pending') {
    throw new Error('Session is not pending');
  }
  
  const now = new Date().toISOString();
  const updates: Partial<Session> = {
    status: 'confirmed',
    confirmedStart: session.requestedStart,
    confirmedEnd: session.requestedEnd,
    updatedAt: now,
  };
  
  try {
    const sessionRef = doc(sessionsCollection, sessionId);
    await updateDoc(sessionRef, updates);
    
    return {
      ...session,
      ...updates,
    } as Session;
  } catch (error) {
    console.error('[scheduling] Failed to accept session', error);
    throw error instanceof Error ? error : new Error('Unable to accept session');
  }
};

export const declineSessionRequest = async (
  sessionId: string,
  reason?: string,
): Promise<Session> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be signed in');
  }
  
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.mentorId !== currentUser.id) {
    throw new Error('Unauthorized');
  }
  
  if (session.status !== 'pending') {
    throw new Error('Session is not pending');
  }
  
  const now = new Date().toISOString();
  const updates: Partial<Session> = {
    status: 'declined',
    mentorResponseReason: reason,
    updatedAt: now,
  };
  
  try {
    const sessionRef = doc(sessionsCollection, sessionId);
    await updateDoc(sessionRef, updates);
    
    return {
      ...session,
      ...updates,
    } as Session;
  } catch (error) {
    console.error('[scheduling] Failed to decline session', error);
    throw error instanceof Error ? error : new Error('Unable to decline session');
  }
};

export const proposeReschedule = async (
  sessionId: string,
  rescheduleOptions: RescheduleOption[],
): Promise<Session> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be signed in');
  }
  
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.mentorId !== currentUser.id) {
    throw new Error('Unauthorized');
  }
  
  if (session.status !== 'pending') {
    throw new Error('Session is not pending');
  }
  
  if (!rescheduleOptions || rescheduleOptions.length === 0) {
    throw new Error('At least one reschedule option is required');
  }
  
  const now = new Date().toISOString();
  const updates: Partial<Session> = {
    status: 'reschedule_proposed',
    rescheduleOptions,
    updatedAt: now,
  };
  
  try {
    const sessionRef = doc(sessionsCollection, sessionId);
    await updateDoc(sessionRef, updates);
    
    return {
      ...session,
      ...updates,
    } as Session;
  } catch (error) {
    console.error('[scheduling] Failed to propose reschedule', error);
    throw error instanceof Error ? error : new Error('Unable to propose reschedule');
  }
};

export const acceptRescheduleOption = async (
  sessionId: string,
  optionIndex: number,
): Promise<Session> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be signed in');
  }
  
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.studentId !== currentUser.id) {
    throw new Error('Unauthorized');
  }
  
  if (session.status !== 'reschedule_proposed') {
    throw new Error('No reschedule proposal to accept');
  }
  
  if (!session.rescheduleOptions || optionIndex >= session.rescheduleOptions.length) {
    throw new Error('Invalid reschedule option');
  }
  
  const selectedOption = session.rescheduleOptions[optionIndex];
  const now = new Date().toISOString();
  
  const updates: Partial<Session> = {
    status: 'confirmed',
    requestedStart: selectedOption.start,
    requestedEnd: selectedOption.end,
    confirmedStart: selectedOption.start,
    confirmedEnd: selectedOption.end,
    rescheduleOptions: undefined,
    updatedAt: now,
  };
  
  try {
    const sessionRef = doc(sessionsCollection, sessionId);
    await updateDoc(sessionRef, updates);
    
    return {
      ...session,
      ...updates,
    } as Session;
  } catch (error) {
    console.error('[scheduling] Failed to accept reschedule', error);
    throw error instanceof Error ? error : new Error('Unable to accept reschedule');
  }
};

export const cancelSession = async (sessionId: string): Promise<Session> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be signed in');
  }
  
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.studentId !== currentUser.id && session.mentorId !== currentUser.id) {
    throw new Error('Unauthorized');
  }
  
  if (session.status === 'cancelled' || session.status === 'completed') {
    throw new Error('Session cannot be cancelled');
  }
  
  const now = new Date().toISOString();
  const updates: Partial<Session> = {
    status: 'cancelled',
    updatedAt: now,
  };
  
  try {
    const sessionRef = doc(sessionsCollection, sessionId);
    await updateDoc(sessionRef, updates);
    
    return {
      ...session,
      ...updates,
    } as Session;
  } catch (error) {
    console.error('[scheduling] Failed to cancel session', error);
    throw error instanceof Error ? error : new Error('Unable to cancel session');
  }
};

export const markSessionComplete = async (sessionId: string): Promise<Session> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be signed in');
  }
  
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.mentorId !== currentUser.id) {
    throw new Error('Only mentors can mark sessions complete');
  }
  
  if (session.status !== 'confirmed') {
    throw new Error('Only confirmed sessions can be marked complete');
  }
  
  const now = new Date().toISOString();
  const updates: Partial<Session> = {
    status: 'completed',
    updatedAt: now,
  };
  
  try {
    const sessionRef = doc(sessionsCollection, sessionId);
    await updateDoc(sessionRef, updates);
    
    return {
      ...session,
      ...updates,
    } as Session;
  } catch (error) {
    console.error('[scheduling] Failed to mark session complete', error);
    throw error instanceof Error ? error : new Error('Unable to mark session complete');
  }
};

export const saveSessionNote = async (
  sessionId: string,
  note: string,
  followUps?: string,
): Promise<SessionNote> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be signed in');
  }
  
  if (currentUser.role !== 'mentor') {
    throw new Error('Only mentors can save session notes');
  }
  
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.mentorId !== currentUser.id) {
    throw new Error('Unauthorized');
  }
  
  const now = new Date().toISOString();
  const noteData: Omit<SessionNote, 'id'> = {
    sessionId,
    mentorId: currentUser.id,
    note,
    followUps,
    createdAt: now,
  };
  
  try {
    const noteRef = await addDoc(sessionNotesCollection, noteData);
    
    return {
      id: noteRef.id,
      ...noteData,
    };
  } catch (error) {
    console.error('[scheduling] Failed to save session note', error);
    throw error instanceof Error ? error : new Error('Unable to save session note');
  }
};

export const getSessionNotes = async (sessionId: string): Promise<SessionNote[]> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be signed in');
  }
  
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.mentorId !== currentUser.id && currentUser.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  try {
    const notesQuery = query(
      sessionNotesCollection,
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(notesQuery);
    return snapshot.docs.map(docSnap => ({
      ...docSnap.data(),
      id: docSnap.id,
    } as SessionNote));
  } catch (error) {
    console.error('[scheduling] Failed to fetch session notes', error);
    throw error instanceof Error ? error : new Error('Unable to load session notes');
  }
};
