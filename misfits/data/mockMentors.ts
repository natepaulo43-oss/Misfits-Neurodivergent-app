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
    mentorProfile: {
      fullName: 'Dr. Sarah Chen',
      timezone: 'America/Los_Angeles',
      currentRole: 'Educational Psychologist',
      expertiseAreas: ['ADHD Coaching', 'Study Skills', 'Executive Function'],
      menteeAgeRange: ['middle_school', 'high_school', 'college'],
      focusAreas: ['academic_support', 'executive_function', 'social_emotional'],
      neurodivergenceExperience: 'experienced',
      communicationMethods: ['video', 'text'],
      availabilitySlots: ['mon_evening', 'tue_evening', 'thu_afternoon'],
      mentoringApproach: ['structured_guidance', 'collaborative_problem_solving'],
      valuedMenteeTraits: ['motivated', 'curious'],
    },
  },
  {
    id: 'mentor-2',
    name: 'Marcus Williams',
    bio: 'Former special education teacher turned mentor. Passionate about helping students discover their strengths and build confidence in their abilities.',
    expertise: ['Dyslexia Support', 'Reading Strategies', 'Self-Advocacy'],
    approved: true,
    profileImage: 'https://via.placeholder.com/150',
    mentorProfile: {
      fullName: 'Marcus Williams',
      timezone: 'America/New_York',
      currentRole: 'Special Education Mentor',
      expertiseAreas: ['Dyslexia Support', 'Reading Strategies', 'Self-Advocacy'],
      menteeAgeRange: ['middle_school', 'high_school'],
      focusAreas: ['academic_support', 'social_emotional'],
      neurodivergenceExperience: 'some_experience',
      communicationMethods: ['video', 'audio'],
      availabilitySlots: ['wed_evening', 'sat_morning'],
      mentoringApproach: ['open_discussion', 'collaborative_problem_solving'],
      valuedMenteeTraits: ['communicative', 'self_directed'],
    },
  },
  {
    id: 'mentor-3',
    name: 'Dr. Emily Rodriguez',
    bio: 'Neuroscientist and autism advocate. Focuses on helping autistic students navigate academic and social environments while embracing their neurodivergent identity.',
    expertise: ['Autism Support', 'Social Skills', 'Sensory Strategies'],
    approved: true,
    profileImage: 'https://via.placeholder.com/150',
    mentorProfile: {
      fullName: 'Dr. Emily Rodriguez',
      timezone: 'America/Chicago',
      currentRole: 'Neuroscientist & Mentor',
      expertiseAreas: ['Autism Support', 'Social Skills', 'Sensory Strategies'],
      menteeAgeRange: ['high_school', 'college'],
      focusAreas: ['social_emotional', 'academic_support'],
      neurodivergenceExperience: 'self_identified',
      communicationMethods: ['video', 'text'],
      availabilitySlots: ['tue_afternoon', 'fri_morning'],
      mentoringApproach: ['structured_guidance', 'hands_on'],
      valuedMenteeTraits: ['curious', 'communicative'],
    },
  },
  {
    id: 'mentor-4',
    name: 'James Park',
    bio: 'Career counselor specializing in helping neurodiverse young adults transition from school to work. Believes every mind has unique gifts to offer.',
    expertise: ['Career Planning', 'Interview Skills', 'Workplace Strategies'],
    approved: true,
    profileImage: 'https://via.placeholder.com/150',
    mentorProfile: {
      fullName: 'James Park',
      timezone: 'America/Denver',
      currentRole: 'Career Counselor',
      expertiseAreas: ['Career Planning', 'Interview Skills', 'Workplace Strategies'],
      menteeAgeRange: ['college', 'adult'],
      focusAreas: ['career_guidance'],
      neurodivergenceExperience: 'experienced',
      communicationMethods: ['video', 'email'],
      availabilitySlots: ['thu_evening', 'sat_afternoon'],
      mentoringApproach: ['open_discussion', 'collaborative_problem_solving'],
      valuedMenteeTraits: ['motivated', 'self_directed'],
    },
  },
  {
    id: 'mentor-5',
    name: 'Lisa Thompson',
    bio: 'Math tutor and learning specialist. Makes math accessible and even enjoyable for students who learn differently.',
    expertise: ['Math Support', 'Dyscalculia', 'Visual Learning'],
    approved: true,
    profileImage: 'https://via.placeholder.com/150',
    mentorProfile: {
      fullName: 'Lisa Thompson',
      timezone: 'America/New_York',
      currentRole: 'Learning Specialist',
      expertiseAreas: ['Math Support', 'Dyscalculia', 'Visual Learning'],
      menteeAgeRange: ['middle_school', 'high_school'],
      focusAreas: ['academic_support'],
      neurodivergenceExperience: 'some_experience',
      communicationMethods: ['text', 'video'],
      availabilitySlots: ['mon_afternoon', 'wed_afternoon'],
      mentoringApproach: ['hands_on', 'structured_guidance'],
      valuedMenteeTraits: ['curious', 'motivated'],
    },
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
