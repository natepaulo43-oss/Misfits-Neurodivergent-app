// Data models per PRD Section 8

import { ImageSourcePropType } from 'react-native';

export type UserRole = 'student' | 'mentor' | 'admin';
export type MentorApplicationStatus =
  | 'not_requested'
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected';

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

export type CuratedContentCategory =
  | 'stories'
  | 'academic_tips'
  | 'organization'
  | 'confidence'
  | 'mentor_spotlight'
  | 'marketplace';

export type CuratedContentFormat = 'article' | 'video' | 'image' | 'resource';
export type CuratedContentStatus = 'draft' | 'published' | 'archived';
export type CuratedContentAudience = 'student' | 'mentor' | 'all';

export interface StudentProfile {
  fullName: string;
  age?: number;
  gradeLevel: GradeLevel;
  locationCity: string;
  locationState: string;
  timezone?: string;
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
  locationCity: string;
  locationState: string;
  timezone?: string;
  currentRole: string;
  expertiseAreas: string[];
  menteeAgeRange: MenteeAgeRange[];
  focusAreas: string[];
  neurodivergenceExperience: NeurodivergenceExperience;
  communicationMethods: CommunicationMethod[];
  availabilitySlots: string[];
  mentoringApproach?: MentoringApproach[];
  valuedMenteeTraits?: MenteeTrait[];
  shortBio?: string;
  funFact?: string;
  acceptingIntroRequests?: boolean;
}

export interface CuratedContent {
  id: string;
  title: string;
  summary: string;
  body: string;
  categories: CuratedContentCategory[];
  format: CuratedContentFormat;
  mediaUrl?: string;
  thumbnailUrl?: string;
  featured?: boolean;
  status: CuratedContentStatus;
  audience: CuratedContentAudience;
  authorName?: string;
  mentorRecommendationNote?: string;
  marketplaceRecommendationUrl?: string;
  relatedMentorIds?: string[];
  tags?: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CuratedContentPayload = Omit<CuratedContent, 'id' | 'createdAt' | 'updatedAt'>;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  pendingRole?: UserRole | null;
  mentorApplicationStatus?: MentorApplicationStatus;
  mentorApplicationSubmittedAt?: string;
  mentorApplicationAdminNotes?: string;
  mentorApplicationAppealText?: string;
  mentorApplicationAppealSubmittedAt?: string;
  interests?: string[];
  learningDifferences?: string[];
  onboardingCompleted?: boolean;
  studentProfile?: StudentProfile;
  mentorProfile?: MentorProfile;
  accountSuspended?: boolean;
  suspensionReason?: string;
  messagingDisabled?: boolean;
  mentorMatchingDisabled?: boolean;
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
  flaggedKeywords?: string[];
  flaggedReviewed?: boolean;
  flaggedReviewedBy?: string;
}

export interface ThreadParticipantProfile {
  id: string;
  name: string;
  role?: UserRole | null;
}

export interface MessageThread {
  id: string;
  participantIds: string[];
  participantNames: string[];
  participants?: Record<string, ThreadParticipantProfile>;
  participantKey?: string;
  lastMessage: string;
  lastMessageTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MatchStatus = 'pending' | 'active' | 'ended';

export interface MatchRecord {
  id: string;
  studentId: string;
  studentName?: string;
  mentorId: string;
  mentorName?: string;
  status: MatchStatus;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export type SessionStatus = 'pending' | 'confirmed' | 'declined' | 'reschedule_proposed' | 'cancelled' | 'completed';

export type ConnectionPreference = 'chat' | 'phone' | 'video' | 'other';

export interface WeeklyAvailabilityBlock {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityException {
  date: string;
  type: 'blocked' | 'override';
  blocks?: WeeklyAvailabilityBlock[];
}

export interface MentorAvailability {
  id: string;
  mentorId: string;
  timezone: string;
  sessionDurations: number[];
  bufferMinutes: number;
  maxSessionsPerDay?: number;
  weeklyBlocks: WeeklyAvailabilityBlock[];
  exceptions: AvailabilityException[];
  updatedAt: string;
}

export interface RescheduleOption {
  start: string;
  end: string;
}

export interface ReminderState {
  sent24h: boolean;
  sent1h: boolean;
  scheduled24h?: string;
  scheduled1h?: string;
}

export interface Session {
  id: string;
  studentId: string;
  mentorId: string;
  status: SessionStatus;
  requestedStart: string;
  requestedEnd: string;
  confirmedStart?: string;
  confirmedEnd?: string;
  studentTimezone: string;
  mentorTimezone: string;
  connectionPreference: ConnectionPreference;
  studentNotes?: string;
  mentorResponseReason?: string;
  rescheduleOptions?: RescheduleOption[];
  chatId?: string;
  createdAt: string;
  updatedAt: string;
  reminderState?: ReminderState;
}

export interface SessionNote {
  id: string;
  sessionId: string;
  mentorId: string;
  note: string;
  followUps?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export type SessionRecord = Session;
