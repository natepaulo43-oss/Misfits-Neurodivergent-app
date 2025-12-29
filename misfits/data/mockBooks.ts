import { Book } from '../types';

// Mock book data - only approved books shown per PRD Section 9
export const mockBooks: Book[] = [
  {
    id: 'book-brilliant',
    title: 'Brilliant, Just in a Different Way',
    author: 'Dr. Eric Tacl',
    description:
      'Brilliant, Just in a Different Way is a heartfelt and empowering story based on the true journey of Dr. Eric Tacl, who grew up navigating learning differences such as dyslexia.\n\nDiagnosed at a young age with multiple learning disabilities, Eric often felt misunderstood and discouraged. But through his mother’s unwavering belief and the guidance of creative teachers, he learned that thinking differently wasn’t a weakness—it was his greatest strength.\n\nThis beautifully written and illustrated story follows Eric’s transformation from a boy who hid under his hoodie to a confident learner, scholar, veteran, and leader. His journey—from struggling with spelling tests to earning his doctorate—shows that success looks different for everyone.\n\nA powerful celebration of neurodiversity, perseverance, and unconditional love, Brilliant, Just in a Different Way reminds every child who learns differently that they are not broken—they are brilliant.',
    price: 16.99,
    coverImage: require('../assets/books/Brilliant_Cover.jpg'),
    tags: ['Neurodiversity', 'Memoir', 'Inspiration'],
    approved: true,
    publisher: 'The Tacl Center for Neurodiversity',
    publicationDate: 'October 10, 2025',
    amazonUrl:
      'https://www.amazon.com/Brilliant-Just-Different-Way-differently-ebook/dp/B0FW1K31NX',
  },
  {
    id: 'book-mommy-words',
    title: 'Mommy, The Words Look Different To Me',
    author: 'Dr. Eric Tacl',
    description:
      'Mommy, the Words Look Different to Me is a heartfelt and empowering story based on the true journey of Dr. Eric Tacl, who grew up navigating learning differences such as dyslexia. Diagnosed at a young age with multiple learning disabilities, Eric often felt misunderstood and discouraged. But through his mother’s unwavering belief and the guidance of creative teachers, he learned that thinking differently wasn’t a weakness—it was his greatest strength.\n\nThis beautifully written and illustrated story follows Eric’s transformation from a boy who hid under his hoodie to a confident learner, scholar, veteran, and leader. His journey—from struggling with spelling tests to earning his doctorate—shows that success looks different for everyone.\n\nA powerful celebration of neurodiversity, perseverance, and unconditional love, Mommy, the Words Look Different to Me reminds every child who learns differently that they are not broken—they are brilliant.',
    price: 16.99,
    coverImage: require('../assets/books/Mommy_Cover.jpg'),
    tags: ['Children', 'Family', 'Dyslexia'],
    approved: true,
    publisher: 'The Tacl Center for Neurodiversity',
    publicationDate: 'October 15, 2025',
    amazonUrl:
      'https://www.amazon.com/Mommy-Words-Look-Different-differently/dp/B0FWJ97YLR',
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
