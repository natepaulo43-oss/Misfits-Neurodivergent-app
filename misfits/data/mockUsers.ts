import { User } from '../types';

// Mock user data for development
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    role: 'student',
    interests: ['Reading', 'Science', 'Art'],
    learningDifferences: ['ADHD', 'Dyslexia'],
  },
  {
    id: 'user-2',
    name: 'Dr. Sarah Chen',
    email: 'sarah@example.com',
    role: 'mentor',
  },
  {
    id: 'user-3',
    name: 'Admin User',
    email: 'admin@misfits.com',
    role: 'admin',
  },
];

// Current logged-in user (mock)
export const mockCurrentUser: User = mockUsers[0];
