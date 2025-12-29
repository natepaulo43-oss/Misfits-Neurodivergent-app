import { Book } from '../types';

// Mock book data - only approved books shown per PRD Section 9
export const mockBooks: Book[] = [
  {
    id: 'book-1',
    title: 'The Dyslexic Advantage',
    author: 'Brock L. Eide, M.D.',
    description: 'Discover the hidden strengths of the dyslexic mind. This groundbreaking book reveals how dyslexic thinking can be a powerful asset in many fields.',
    price: 16.99,
    coverImage: 'https://via.placeholder.com/200x300',
    tags: ['Dyslexia', 'Strengths-Based', 'Self-Help'],
    approved: true,
  },
  {
    id: 'book-2',
    title: 'Driven to Distraction',
    author: 'Edward M. Hallowell, M.D.',
    description: 'The classic guide to understanding and managing ADHD. Offers practical strategies for turning ADHD challenges into advantages.',
    price: 18.99,
    coverImage: 'https://via.placeholder.com/200x300',
    tags: ['ADHD', 'Classic', 'Practical'],
    approved: true,
  },
  {
    id: 'book-3',
    title: 'Neurotribes',
    author: 'Steve Silberman',
    description: 'A fascinating history of autism and neurodiversity. Explores how society can better embrace neurological differences.',
    price: 19.99,
    coverImage: 'https://via.placeholder.com/200x300',
    tags: ['Autism', 'History', 'Neurodiversity'],
    approved: true,
  },
  {
    id: 'book-4',
    title: 'Smart but Scattered',
    author: 'Peg Dawson, Ed.D.',
    description: 'Help for kids and teens who struggle with executive function skills. Practical strategies for organization, time management, and more.',
    price: 17.99,
    coverImage: 'https://via.placeholder.com/200x300',
    tags: ['Executive Function', 'Teens', 'Practical'],
    approved: true,
  },
  {
    id: 'book-5',
    title: 'The Gift of Dyslexia',
    author: 'Ronald D. Davis',
    description: 'A revolutionary approach to understanding dyslexia as a gift rather than a disability. Includes practical techniques for reading improvement.',
    price: 15.99,
    coverImage: 'https://via.placeholder.com/200x300',
    tags: ['Dyslexia', 'Techniques', 'Empowering'],
    approved: true,
  },
  {
    id: 'book-6',
    title: 'Thinking Differently',
    author: 'David Flink',
    description: 'A guide for young people with learning differences. Written by someone who has been there and found success.',
    price: 14.99,
    coverImage: 'https://via.placeholder.com/200x300',
    tags: ['Learning Differences', 'Youth', 'Memoir'],
    approved: true,
  },
];

// Helper to get only approved books
export const getApprovedBooks = (): Book[] => {
  return mockBooks.filter(book => book.approved);
};

// Helper to get book by ID
export const getBookById = (id: string): Book | undefined => {
  return mockBooks.find(book => book.id === id && book.approved);
};
