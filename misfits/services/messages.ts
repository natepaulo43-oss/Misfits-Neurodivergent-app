import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  CollectionReference,
  DocumentSnapshot,
} from 'firebase/firestore';

import { db } from './firebase';
import { Message, MessageThread, ThreadParticipantProfile } from '../types';

type ThreadDocument = MessageThread & {
  participantKey?: string;
};

const threadsCollection = collection(db, 'threads') as CollectionReference<ThreadDocument>;

const buildParticipantKey = (ids: string[]): string => [...ids].sort().join('__');

const buildParticipantsRecord = (
  profiles: ThreadParticipantProfile[],
): Record<string, ThreadParticipantProfile> => {
  return profiles.reduce<Record<string, ThreadParticipantProfile>>((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {});
};

const mapThreadDoc = (docSnapshot: DocumentSnapshot<ThreadDocument>): MessageThread => {
  const data = docSnapshot.data() as ThreadDocument;
  return {
    id: docSnapshot.id,
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

const sanitizeMessage = (text: string): string => {
  return text.trim().slice(0, 1000);
};

export const fetchThreads = async (userId: string): Promise<MessageThread[]> => {
  if (!userId) return [];

  try {
    const threadsQuery = query(threadsCollection, where('participantIds', 'array-contains', userId));
    const snapshot = await getDocs(threadsQuery);
    const threads = snapshot.docs.map(docSnap => mapThreadDoc(docSnap));

    return threads.sort((a, b) => {
      const aTime = a.lastMessageTime || a.updatedAt || '';
      const bTime = b.lastMessageTime || b.updatedAt || '';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  } catch (error) {
    console.error('[messages] Failed to fetch threads', error);
    throw error instanceof Error ? error : new Error('Unable to load message threads');
  }
};

export const fetchThreadById = async (threadId: string): Promise<MessageThread | null> => {
  if (!threadId) return null;

  try {
    const threadRef = doc(threadsCollection, threadId);
    const snapshot = await getDoc(threadRef);
    if (!snapshot.exists()) {
      return null;
    }

    return mapThreadDoc(snapshot);
  } catch (error) {
    console.error('[messages] Failed to fetch thread by id', error);
    throw error instanceof Error ? error : new Error('Unable to load conversation');
  }
};

export const fetchMessages = async (threadId: string): Promise<Message[]> => {
  if (!threadId) return [];

  try {
    const messagesRef = collection(doc(threadsCollection, threadId), 'messages');
    const messagesSnapshot = await getDocs(query(messagesRef, orderBy('timestamp', 'asc')));
    const messages = messagesSnapshot.docs
      .map(messageDoc => {
        const data = messageDoc.data() as Message;
        return {
          id: messageDoc.id,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          text: data.text,
          timestamp: data.timestamp,
        };
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return messages;
  } catch (error) {
    console.error('[messages] Failed to fetch messages', error);
    throw error instanceof Error ? error : new Error('Unable to load messages');
  }
};

export const sendMessage = async (
  threadId: string,
  fromUserId: string,
  toUserId: string,
  text: string,
): Promise<Message> => {
  if (!threadId || !fromUserId || !toUserId) {
    throw new Error('Invalid message parameters');
  }

  const sanitized = sanitizeMessage(text);
  if (!sanitized) {
    throw new Error('Message cannot be empty');
  }

  const timestamp = new Date().toISOString();
  const newMessage: Message = {
    id: '',
    fromUserId,
    toUserId,
    text: sanitized,
    timestamp,
  };

  try {
    const threadRef = doc(threadsCollection, threadId);
    const messagesRef = collection(threadRef, 'messages');
    const savedMessage = await addDoc(messagesRef, {
      fromUserId,
      toUserId,
      text: sanitized,
      timestamp,
    });

    await updateDoc(threadRef, {
      lastMessage: sanitized,
      lastMessageTime: timestamp,
      updatedAt: timestamp,
    });

    return { ...newMessage, id: savedMessage.id };
  } catch (error) {
    console.error('[messages] Failed to send message', error);
    throw error instanceof Error ? error : new Error('Unable to send message');
  }
};

export const startNewThread = async (
  currentUserId: string,
  currentUserName: string,
  otherUserId: string,
  otherUserName: string,
  initialMessage: string,
  options?: { sendInitialMessageOnExisting?: boolean },
): Promise<MessageThread> => {
  if (!currentUserId || !otherUserId) {
    throw new Error('Invalid participants');
  }

  const participantIds = [currentUserId, otherUserId];
  const participantNames = [currentUserName, otherUserName];
  const participants = buildParticipantsRecord([
    { id: currentUserId, name: currentUserName },
    { id: otherUserId, name: otherUserName },
  ]);
  const participantKey = buildParticipantKey(participantIds);
  const sanitizedMessage = sanitizeMessage(initialMessage);
  const timestamp = new Date().toISOString();

  const findExistingThread = async (): Promise<MessageThread | null> => {
    const existingQuery = query(threadsCollection, where('participantKey', '==', participantKey), limit(1));
    const snapshot = await getDocs(existingQuery);
    if (snapshot.empty) return null;
    return mapThreadDoc(snapshot.docs[0]);
  };

  try {
    const existingThread = await findExistingThread();

    if (existingThread) {
      if (sanitizedMessage && options?.sendInitialMessageOnExisting) {
        await sendMessage(existingThread.id, currentUserId, otherUserId, sanitizedMessage);
      }
      return existingThread;
    }

    if (!sanitizedMessage) {
      throw new Error('Initial message is required for new threads');
    }

    const threadPayload: ThreadDocument = {
      id: '',
      participantIds,
      participantNames,
      participants,
      participantKey,
      lastMessage: sanitizedMessage,
      lastMessageTime: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const newThreadRef = await addDoc(threadsCollection, threadPayload);
    const threadId = newThreadRef.id;

    await addDoc(collection(newThreadRef, 'messages'), {
      fromUserId: currentUserId,
      toUserId: otherUserId,
      text: sanitizedMessage,
      timestamp,
    });

    return {
      id: threadId,
      participantIds,
      participantNames,
      participants,
      participantKey,
      lastMessage: sanitizedMessage,
      lastMessageTime: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  } catch (error) {
    console.error('[messages] Failed to start thread', error);
    throw error instanceof Error ? error : new Error('Unable to start conversation');
  }
};

export const getOtherParticipantName = (thread: MessageThread, currentUserId: string): string => {
  if (thread.participants) {
    const other = Object.values(thread.participants).find(participant => participant.id !== currentUserId);
    if (other?.name) {
      return other.name;
    }
  }

  const otherIndex = thread.participantIds.findIndex(pid => pid !== currentUserId);
  if (otherIndex >= 0 && thread.participantNames[otherIndex]) {
    return thread.participantNames[otherIndex];
  }

  return 'Conversation';
};
