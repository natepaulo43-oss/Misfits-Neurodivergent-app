import { Message, MessageThread } from '../types';

// Mock message threads
export const mockThreads: MessageThread[] = [
  {
    id: 'thread-1',
    participantIds: ['user-1', 'mentor-1'],
    participantNames: ['Alex Johnson', 'Dr. Sarah Chen'],
    lastMessage: 'Looking forward to our next session!',
    lastMessageTime: '2024-01-15T10:30:00Z',
  },
  {
    id: 'thread-2',
    participantIds: ['user-1', 'mentor-2'],
    participantNames: ['Alex Johnson', 'Marcus Williams'],
    lastMessage: 'The reading strategies are really helping.',
    lastMessageTime: '2024-01-14T15:45:00Z',
  },
];

// Mock messages for thread-1
export const mockMessages: Record<string, Message[]> = {
  'thread-1': [
    {
      id: 'msg-1',
      fromUserId: 'user-1',
      toUserId: 'mentor-1',
      text: 'Hi Dr. Chen! I wanted to ask about study techniques for my upcoming exams.',
      timestamp: '2024-01-15T09:00:00Z',
    },
    {
      id: 'msg-2',
      fromUserId: 'mentor-1',
      toUserId: 'user-1',
      text: 'Hi Alex! Great to hear from you. What subjects are you preparing for?',
      timestamp: '2024-01-15T09:15:00Z',
    },
    {
      id: 'msg-3',
      fromUserId: 'user-1',
      toUserId: 'mentor-1',
      text: 'Math and Science. I find it hard to focus during long study sessions.',
      timestamp: '2024-01-15T09:30:00Z',
    },
    {
      id: 'msg-4',
      fromUserId: 'mentor-1',
      toUserId: 'user-1',
      text: 'That\'s common with ADHD. Let\'s try the Pomodoro technique - 25 minutes of focused study, then a 5-minute break. We can discuss more strategies in our next session.',
      timestamp: '2024-01-15T10:00:00Z',
    },
    {
      id: 'msg-5',
      fromUserId: 'user-1',
      toUserId: 'mentor-1',
      text: 'That sounds helpful! Looking forward to our next session!',
      timestamp: '2024-01-15T10:30:00Z',
    },
  ],
  'thread-2': [
    {
      id: 'msg-6',
      fromUserId: 'user-1',
      toUserId: 'mentor-2',
      text: 'Hi Marcus, I tried the colored overlay you suggested.',
      timestamp: '2024-01-14T14:00:00Z',
    },
    {
      id: 'msg-7',
      fromUserId: 'mentor-2',
      toUserId: 'user-1',
      text: 'That\'s great! How did it work for you?',
      timestamp: '2024-01-14T14:30:00Z',
    },
    {
      id: 'msg-8',
      fromUserId: 'user-1',
      toUserId: 'mentor-2',
      text: 'The reading strategies are really helping. I finished a whole chapter without getting tired!',
      timestamp: '2024-01-14T15:45:00Z',
    },
  ],
};

// Helper to get threads for a user
export const getThreadsForUser = (userId: string): MessageThread[] => {
  return mockThreads.filter(thread => thread.participantIds.includes(userId));
};

// Helper to get messages for a thread
export const getMessagesForThread = (threadId: string): Message[] => {
  return mockMessages[threadId] || [];
};

// Helper to get other participant name
export const getOtherParticipantName = (thread: MessageThread, currentUserId: string): string => {
  const index = thread.participantIds.indexOf(currentUserId);
  const otherIndex = index === 0 ? 1 : 0;
  return thread.participantNames[otherIndex];
};
