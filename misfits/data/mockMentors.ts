import { Mentor } from '../types';

// Mock mentor data - only approved mentors shown per PRD Section 9
export const mockMentors: Mentor[] = [
  {
    id: 'mentor-1',
    name: 'Dr. Sarah Chen',
    bio: 'Educational psychologist with 15 years of experience working with neurodiverse students. Specializes in helping students develop personalized learning strategies that work with their unique minds.',
    expertise: ['ADHD Coaching', 'Study Skills', 'Executive Function'],
    approved: true,
    profileImage: 'https://via.placeholder.com/150',
  },
  {
    id: 'mentor-2',
    name: 'Marcus Williams',
    bio: 'Former special education teacher turned mentor. Passionate about helping students discover their strengths and build confidence in their abilities.',
    expertise: ['Dyslexia Support', 'Reading Strategies', 'Self-Advocacy'],
    approved: true,
    profileImage: 'https://via.placeholder.com/150',
  },
  {
    id: 'mentor-3',
    name: 'Dr. Emily Rodriguez',
    bio: 'Neuroscientist and autism advocate. Focuses on helping autistic students navigate academic and social environments while embracing their neurodivergent identity.',
    expertise: ['Autism Support', 'Social Skills', 'Sensory Strategies'],
    approved: true,
    profileImage: 'https://via.placeholder.com/150',
  },
  {
    id: 'mentor-4',
    name: 'James Park',
    bio: 'Career counselor specializing in helping neurodiverse young adults transition from school to work. Believes every mind has unique gifts to offer.',
    expertise: ['Career Planning', 'Interview Skills', 'Workplace Strategies'],
    approved: true,
    profileImage: 'https://via.placeholder.com/150',
  },
  {
    id: 'mentor-5',
    name: 'Lisa Thompson',
    bio: 'Math tutor and learning specialist. Makes math accessible and even enjoyable for students who learn differently.',
    expertise: ['Math Support', 'Dyscalculia', 'Visual Learning'],
    approved: true,
    profileImage: 'https://via.placeholder.com/150',
  },
];

// Helper to get only approved mentors
export const getApprovedMentors = (): Mentor[] => {
  return mockMentors.filter(mentor => mentor.approved);
};

// Helper to get mentor by ID
export const getMentorById = (id: string): Mentor | undefined => {
  return mockMentors.find(mentor => mentor.id === id && mentor.approved);
};
