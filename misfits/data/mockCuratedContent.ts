import { CuratedContent } from '../types';

const now = new Date().toISOString();

const curatedContent: CuratedContent[] = [
  {
    id: 'mock-story-1',
    title: 'Finding Flow in a Neurotypical Classroom',
    summary: 'A software engineer with ADHD shares the planning system that unlocked her confidence in college.',
    body:
      'When I arrived at Stanford, I thought I was already behind. The turning point was building a "flow grid" that paired my natural hyper-focus windows with challenging labs. Here is the template and how I iterated on it with my mentor.',
    categories: ['stories', 'confidence'],
    format: 'article',
    mediaUrl: 'https://misfits.example.com/resources/flow-grid.pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80',
    featured: true,
    status: 'published',
    audience: 'all',
    authorName: 'Lina Perez',
    mentorRecommendationNote: 'Pairs well with mentors who emphasize structured experimentation.',
    marketplaceRecommendationUrl: 'https://misfits.example.com/marketplace/focus-kit',
    relatedMentorIds: ['mentor-42'],
    tags: ['focus', 'planning'],
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mock-academic-1',
    title: 'Executive Function Sprint Board',
    summary: 'Printable kanban board that combines academic planning with sensory breaks.',
    body:
      'Use this sprint board template to chunk projects into 25-minute focus blocks. It includes built-in prompts for hydration, movement, and mentor check-ins.',
    categories: ['academic_tips', 'organization'],
    format: 'resource',
    mediaUrl: 'https://misfits.example.com/templates/sprint-board',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
    featured: false,
    status: 'published',
    audience: 'student',
    authorName: 'Misfits Academics Team',
    mentorRecommendationNote: 'Mentors can reference this during accountability sessions.',
    relatedMentorIds: ['mentor-05', 'mentor-12'],
    tags: ['templates', 'focus'],
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mock-confidence-1',
    title: 'Micro-Bravery Challenges for First Meetings',
    summary: 'Confidence-building checklist to use before intro calls with mentors or marketplace providers.',
    body:
      'These 10 micro-bravery reps take under five minutes and help regulate before any high-stakes conversation. Students report a 48% decrease in pre-call anxiety when pairing this with breathwork.',
    categories: ['confidence'],
    format: 'image',
    mediaUrl: 'https://misfits.example.com/resources/micro-bravery.png',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    featured: false,
    status: 'published',
    audience: 'student',
    authorName: 'Coach Amir',
    mentorRecommendationNote: 'Great primer to send mentees before mock interviews.',
    tags: ['confidence', 'rituals'],
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'mock-mentor-spotlight',
    title: 'Mentor Spotlight: Dr. Maya Chen',
    summary: 'How Maya combines sensory-friendly lab tours with marketplace prototyping projects.',
    body:
      'Maya is a neuroscientist, maker educator, and autistic advocate. Learn how she scaffolds creative prototyping sessions for mentees with dyslexia and ADHD.',
    categories: ['mentor_spotlight', 'stories'],
    format: 'video',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80',
    featured: false,
    status: 'published',
    audience: 'mentor',
    authorName: 'Mentor Enablement',
    mentorRecommendationNote: 'Pairs with marketplace listing: Sensory Lab Starter Kit.',
    marketplaceRecommendationUrl: 'https://misfits.example.com/marketplace/sensory-lab-kit',
    tags: ['mentor_spotlight'],
    relatedMentorIds: ['mentor-88'],
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

export const getMockCuratedContent = (): CuratedContent[] => curatedContent;

export const getMockPublishedCuratedContent = (
  audience: 'student' | 'mentor' | 'all',
): CuratedContent[] => {
  return curatedContent
    .filter(item => item.status === 'published')
    .filter(item => item.audience === 'all' || item.audience === audience || audience === 'all')
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.publishedAt || b.updatedAt).getTime() - new Date(a.publishedAt || a.updatedAt).getTime();
    });
};
