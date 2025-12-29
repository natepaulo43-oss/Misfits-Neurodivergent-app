// Mentor service stub
// TODO: Connect to Firestore when ready

import { Mentor } from '../types';
import { getApprovedMentors, getMentorById } from '../data/mockMentors';

// TODO: Replace with Firestore query - collection('mentors').where('approved', '==', true)
export const fetchMentors = async (): Promise<Mentor[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return getApprovedMentors();
};

// TODO: Replace with Firestore doc query - doc('mentors', id)
export const fetchMentorById = async (id: string): Promise<Mentor | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return getMentorById(id) || null;
};
