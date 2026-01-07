// Data models per PRD Section 8

import { ImageSourcePropType } from 'react-native';

export type UserRole = 'student' | 'mentor' | 'admin';

export type GradeLevel = 'middle_school' | 'high_school' | 'college' | 'other';
export type MeetingFrequency = 'weekly' | 'biweekly' | 'monthly';
export type MentorTrait =
  | 'patient'
  | 'structured'
  | 'creative'
  | 'empathetic'
  | 'goal_oriented'
  | 'experienced';
export type GuidanceStyle = 'step_by_step' | 'open_discussion' | 'visual_examples' | 'trial_error';
export type LearningStyle = 'visual' | 'auditory' | 'reading_writing' | 'hands_on';
export type CommunicationMethod = 'text' | 'video' | 'audio' | 'email';
export type SupportGoal =
  | 'academic_support'
  | 'social_emotional'
  | 'career_guidance'
  | 'other';
export type NeurodivergenceOption = 'adhd' | 'autism' | 'dyslexia' | 'other' | 'prefer_not_to_say';

export interface StudentProfile {
  fullName: string;
  age?: number;
  gradeLevel: GradeLevel;
  timezone: string;
  availabilitySlots?: string[];
  supportGoals: SupportGoal[];
  supportGoalsOther?: string;
  learningStyles: LearningStyle[];
  communicationMethods: CommunicationMethod[];
  meetingFrequency: MeetingFrequency;
  mentorTraits: MentorTrait[];
  guidanceStyle?: GuidanceStyle;
  preferredCommunicationNotes?: string;
  neurodivergence?: NeurodivergenceOption;
  strengthsText?: string;
  challengesText?: string;
}

export type MenteeAgeRange = 'middle_school' | 'high_school' | 'college' | 'adult';
export type NeurodivergenceExperience =
  | 'experienced'
  | 'some_experience'
  | 'no_experience'
  | 'self_identified';
export type MentoringApproach =
  | 'structured_guidance'
  | 'open_discussion'
  | 'collaborative_problem_solving'
  | 'hands_on';
export type MenteeTrait =
  | 'motivated'
  | 'curious'
  | 'communicative'
  | 'self_directed';

export interface MentorProfile {
  fullName: string;
  age?: number;
  timezone: string;
  currentRole: string;
  expertiseAreas: string[];
  menteeAgeRange: MenteeAgeRange[];
  focusAreas: string[];
  neurodivergenceExperience: NeurodivergenceExperience;
  communicationMethods: CommunicationMethod[];
  availabilitySlots: string[];
  mentoringApproach: MentoringApproach[];
  valuedMenteeTraits?: MenteeTrait[];
  shortBio?: string;
  funFact?: string;
  acceptingIntroRequests?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  interests?: string[];
  learningDifferences?: string[];
  onboardingCompleted?: boolean;
  studentProfile?: StudentProfile;
  mentorProfile?: MentorProfile;
}

export interface Mentor {
  id: string;
  name: string;
  bio: string;
  expertise: string[];
  approved: boolean;
  profileImage?: string;
  mentorProfile?: MentorProfile;
  acceptingIntroRequests?: boolean;
  matchScore?: number;
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

export interface MentorMatchBreakdown {
  supportGoals: number;
  communication: number;
  availability: number;
  mentoringStyle: number;
  neuroExperience: number;
}

export interface MentorMatchResult {
  mentor_id: string;
  mentor_name?: string;
  compatibility_score: number;
  match_reasons: string[];
  breakdown: MentorMatchBreakdown;
}

export interface MentorMatchMetadata {
  weights: Record<string, number>;
  threshold: number;
  disclaimer?: string;
  total_considered: number;
  total_returned: number;
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
