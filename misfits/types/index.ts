// Data models per PRD Section 8

import { ImageSourcePropType } from 'react-native';

export type UserRole = 'student' | 'mentor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  interests?: string[];
  learningDifferences?: string[];
}

export interface Mentor {
  id: string;
  name: string;
  bio: string;
  expertise: string[];
  approved: boolean;
  profileImage?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  coverImage: ImageSourcePropType;
  tags: string[];
  approved: boolean;
  publisher: string;
  publicationDate: string;
  amazonUrl: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  timestamp: string;
}

export interface MessageThread {
  id: string;
  participantIds: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: string;
}
