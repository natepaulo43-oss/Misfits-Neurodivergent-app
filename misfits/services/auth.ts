// Authentication service stub
// TODO: Connect to Firebase Auth when ready

import { User, UserRole } from '../types';
import { mockCurrentUser } from '../data/mockUsers';

// Simulated auth state
let currentUser: User | null = null;

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// TODO: Replace with Firebase Auth signInWithEmailAndPassword
export const login = async (data: LoginData): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock login - always succeeds with mock user
  currentUser = mockCurrentUser;
  return currentUser;
};

// TODO: Replace with Firebase Auth createUserWithEmailAndPassword
export const signUp = async (data: SignUpData): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock signup - creates new user
  const newUser: User = {
    id: `user-${Date.now()}`,
    name: data.name,
    email: data.email,
    role: 'student', // Default role, will be updated in role selection
  };
  
  currentUser = newUser;
  return newUser;
};

// TODO: Replace with Firebase Auth signOut
export const logout = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  currentUser = null;
};

// TODO: Replace with Firebase Auth onAuthStateChanged
export const getCurrentUser = (): User | null => {
  return currentUser;
};

// TODO: Replace with Firestore user document update
export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (currentUser && currentUser.id === userId) {
    currentUser = { ...currentUser, role };
  }
};

// TODO: Replace with Firestore user document update
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<User>
): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (currentUser && currentUser.id === userId) {
    currentUser = { ...currentUser, ...updates };
    return currentUser;
  }
  
  throw new Error('User not found');
};
