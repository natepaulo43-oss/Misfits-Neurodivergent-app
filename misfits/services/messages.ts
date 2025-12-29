// Message service stub
// TODO: Connect to Firestore when ready

import { Message, MessageThread } from '../types';
import { 
  getThreadsForUser, 
  getMessagesForThread, 
  mockThreads,
  mockMessages 
} from '../data/mockMessages';

// TODO: Replace with Firestore query - collection('threads').where('participantIds', 'array-contains', userId)
export const fetchThreads = async (userId: string): Promise<MessageThread[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return getThreadsForUser(userId);
};

// TODO: Replace with Firestore query - collection('threads/{threadId}/messages').orderBy('timestamp')
export const fetchMessages = async (threadId: string): Promise<Message[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return getMessagesForThread(threadId);
};

// TODO: Replace with Firestore addDoc - collection('threads/{threadId}/messages')
export const sendMessage = async (
  threadId: string,
  fromUserId: string,
  toUserId: string,
  text: string
): Promise<Message> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const newMessage: Message = {
    id: `msg-${Date.now()}`,
    fromUserId,
    toUserId,
    text,
    timestamp: new Date().toISOString(),
  };
  
  // Add to mock data (in-memory only)
  if (mockMessages[threadId]) {
    mockMessages[threadId].push(newMessage);
  }
  
  return newMessage;
};

// TODO: Replace with Firestore transaction to create thread and first message
export const startNewThread = async (
  currentUserId: string,
  currentUserName: string,
  otherUserId: string,
  otherUserName: string,
  initialMessage: string
): Promise<MessageThread> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newThread: MessageThread = {
    id: `thread-${Date.now()}`,
    participantIds: [currentUserId, otherUserId],
    participantNames: [currentUserName, otherUserName],
    lastMessage: initialMessage,
    lastMessageTime: new Date().toISOString(),
  };
  
  // Add to mock data
  mockThreads.push(newThread);
  mockMessages[newThread.id] = [
    {
      id: `msg-${Date.now()}`,
      fromUserId: currentUserId,
      toUserId: otherUserId,
      text: initialMessage,
      timestamp: new Date().toISOString(),
    },
  ];
  
  return newThread;
};
