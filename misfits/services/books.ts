// Book service stub
// TODO: Connect to Firestore when ready

import { Book } from '../types';
import { getApprovedBooks, getBookById } from '../data/mockBooks';

// TODO: Replace with Firestore query - collection('books').where('approved', '==', true)
export const fetchBooks = async (): Promise<Book[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return getApprovedBooks();
};

// TODO: Replace with Firestore doc query - doc('books', id)
export const fetchBookById = async (id: string): Promise<Book | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return getBookById(id) || null;
};

// Mock purchase flow - per PRD, no actual payment processing
export const purchaseBook = async (bookId: string, userId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // TODO: In production, this would create a purchase record in Firestore
  // For MVP, just return success
  console.log(`Mock purchase: User ${userId} purchased book ${bookId}`);
  return true;
};
