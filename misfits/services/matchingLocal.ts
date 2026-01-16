import { Mentor, StudentProfile, MentorProfile } from '../types';

export interface LocalMatchResult {
  mentorId: string;
  score: number;
  reasons: string[];
  isCurrentlyAvailable: boolean;
  breakdown: {
    supportGoals: number;
    communication: number;
    guidanceStyle: number;
    neurodivergence: number;
    timezone: number;
    meetingFrequency: number;
    interests: number;
  };
}

export interface LocalMatchResponse {
  matches: LocalMatchResult[];
  metadata: {
    totalConsidered: number;
    totalReturned: number;
    computedAt: string;
  };
}

const WEIGHTS = {
  supportGoals: 3.0,
  communication: 2.5,
  guidanceStyle: 2.5,
  neurodivergence: 2.0,
  timezone: 1.5,
  meetingFrequency: 1.0,
  interests: 1.0,
};

const AVAILABILITY_BOOST = 2.0;

const calculateTimezoneCompatibility = (
  studentTimezone?: string,
  mentorTimezone?: string,
): number => {
  if (!studentTimezone || !mentorTimezone) return 0;
  
  const timezoneOffsets: Record<string, number> = {
    'America/New_York': -5,
    'America/Chicago': -6,
    'America/Denver': -7,
    'America/Los_Angeles': -8,
    'America/Phoenix': -7,
    'America/Anchorage': -9,
    'Pacific/Honolulu': -10,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Asia/Tokyo': 9,
    'Australia/Sydney': 11,
  };
  
  const studentOffset = timezoneOffsets[studentTimezone] ?? -5;
  const mentorOffset = timezoneOffsets[mentorTimezone] ?? -5;
  const hoursDiff = Math.abs(studentOffset - mentorOffset);
  
  if (hoursDiff <= 1) return 1.0;
  if (hoursDiff <= 3) return 0.5;
  return 0;
};

const calculateArrayOverlap = <T>(arr1: T[], arr2: T[]): number => {
  if (!arr1?.length || !arr2?.length) return 0;
  const set1 = new Set(arr1);
  const overlap = arr2.filter(item => set1.has(item)).length;
  return overlap / Math.max(arr1.length, arr2.length);
};

const calculateSupportGoalsScore = (
  student: StudentProfile,
  mentor: MentorProfile,
): { score: number; reasons: string[] } => {
  const reasons: string[] = [];
  let score = 0;
  
  if (!student.supportGoals?.length || !mentor.focusAreas?.length) {
    return { score: 0, reasons };
  }
  
  const studentGoals = new Set(student.supportGoals);
  const matchedGoals: string[] = [];
  
  const goalMapping: Record<string, string[]> = {
    academic_support: ['academic', 'study', 'homework', 'school', 'learning'],
    social_emotional: ['social', 'emotional', 'confidence', 'self-esteem', 'relationships'],
    career_guidance: ['career', 'job', 'professional', 'work', 'internship'],
  };
  
  for (const goal of student.supportGoals) {
    const keywords = goalMapping[goal] || [goal];
    const mentorFocusLower = mentor.focusAreas.map(f => f.toLowerCase());
    
    for (const keyword of keywords) {
      if (mentorFocusLower.some(focus => focus.includes(keyword))) {
        matchedGoals.push(goal);
        break;
      }
    }
  }
  
  if (matchedGoals.length > 0) {
    score = matchedGoals.length / student.supportGoals.length;
    const goalLabels = matchedGoals.map(g => g.replace('_', ' ')).join(', ');
    reasons.push(`Matches your support goals: ${goalLabels}`);
  }
  
  return { score, reasons };
};

const calculateCommunicationScore = (
  student: StudentProfile,
  mentor: MentorProfile,
): { score: number; reasons: string[] } => {
  const reasons: string[] = [];
  
  if (!student.communicationMethods?.length || !mentor.communicationMethods?.length) {
    return { score: 0, reasons };
  }
  
  const overlap = calculateArrayOverlap(student.communicationMethods, mentor.communicationMethods);
  
  if (overlap > 0) {
    const commonMethods = student.communicationMethods.filter(m =>
      mentor.communicationMethods.includes(m)
    );
    if (commonMethods.length > 0) {
      reasons.push(`Supports ${commonMethods.join(', ')} communication`);
    }
  }
  
  return { score: overlap, reasons };
};

const calculateGuidanceStyleScore = (
  student: StudentProfile,
  mentor: MentorProfile,
): { score: number; reasons: string[] } => {
  const reasons: string[] = [];
  let score = 0;
  
  if (!student.guidanceStyle || !mentor.mentoringApproach?.length) {
    return { score: 0, reasons };
  }
  
  const styleMapping: Record<string, string[]> = {
    step_by_step: ['structured_guidance'],
    open_discussion: ['open_discussion', 'collaborative_problem_solving'],
    visual_examples: ['structured_guidance', 'hands_on'],
    trial_error: ['hands_on', 'collaborative_problem_solving'],
  };
  
  const compatibleApproaches = styleMapping[student.guidanceStyle] || [];
  const hasMatch = mentor.mentoringApproach.some(approach =>
    compatibleApproaches.includes(approach)
  );
  
  if (hasMatch) {
    score = 1.0;
    const styleLabel = student.guidanceStyle.replace('_', ' ');
    reasons.push(`Mentoring style matches your ${styleLabel} preference`);
  }
  
  return { score, reasons };
};

const calculateNeurodivergenceScore = (
  student: StudentProfile,
  mentor: MentorProfile,
): { score: number; reasons: string[] } => {
  const reasons: string[] = [];
  let score = 0;
  
  if (!student.neurodivergence || student.neurodivergence === 'prefer_not_to_say') {
    return { score: 0, reasons };
  }
  
  if (!mentor.neurodivergenceExperience) {
    return { score: 0, reasons };
  }
  
  if (mentor.neurodivergenceExperience === 'experienced') {
    score = 1.0;
    reasons.push('Experienced with neurodivergent learners');
  } else if (mentor.neurodivergenceExperience === 'some_experience') {
    score = 0.7;
    reasons.push('Has some neurodivergent experience');
  } else if (mentor.neurodivergenceExperience === 'self_identified') {
    score = 0.8;
    reasons.push('Self-identified neurodivergent mentor');
  }
  
  return { score, reasons };
};

const calculateMeetingFrequencyScore = (
  student: StudentProfile,
  mentor: MentorProfile,
): { score: number; reasons: string[] } => {
  const reasons: string[] = [];
  let score = 0.5;
  
  return { score, reasons };
};

const calculateInterestsScore = (
  student: StudentProfile,
  mentor: MentorProfile,
): { score: number; reasons: string[] } => {
  const reasons: string[] = [];
  let score = 0;
  
  if (mentor.expertiseAreas?.length && student.supportGoals?.length) {
    const expertiseLower = mentor.expertiseAreas.map(e => e.toLowerCase());
    const hasRelevantExpertise = expertiseLower.some(exp =>
      exp.length > 3 && (
        student.supportGoalsOther?.toLowerCase().includes(exp) ||
        student.strengthsText?.toLowerCase().includes(exp)
      )
    );
    
    if (hasRelevantExpertise) {
      score = 0.5;
    }
  }
  
  return { score, reasons };
};

export const computeLocalMatch = (
  student: StudentProfile,
  mentor: Mentor,
  isCurrentlyAvailable: boolean,
): LocalMatchResult => {
  const mentorProfile = mentor.mentorProfile;
  
  if (!mentorProfile) {
    return {
      mentorId: mentor.id,
      score: 0,
      reasons: [],
      isCurrentlyAvailable: false,
      breakdown: {
        supportGoals: 0,
        communication: 0,
        guidanceStyle: 0,
        neurodivergence: 0,
        timezone: 0,
        meetingFrequency: 0,
        interests: 0,
      },
    };
  }
  
  const supportGoals = calculateSupportGoalsScore(student, mentorProfile);
  const communication = calculateCommunicationScore(student, mentorProfile);
  const guidanceStyle = calculateGuidanceStyleScore(student, mentorProfile);
  const neurodivergence = calculateNeurodivergenceScore(student, mentorProfile);
  const timezone = calculateTimezoneCompatibility(student.timezone, mentorProfile.timezone);
  const meetingFrequency = calculateMeetingFrequencyScore(student, mentorProfile);
  const interests = calculateInterestsScore(student, mentorProfile);
  
  const breakdown = {
    supportGoals: supportGoals.score,
    communication: communication.score,
    guidanceStyle: guidanceStyle.score,
    neurodivergence: neurodivergence.score,
    timezone,
    meetingFrequency: meetingFrequency.score,
    interests: interests.score,
  };
  
  let totalScore =
    breakdown.supportGoals * WEIGHTS.supportGoals +
    breakdown.communication * WEIGHTS.communication +
    breakdown.guidanceStyle * WEIGHTS.guidanceStyle +
    breakdown.neurodivergence * WEIGHTS.neurodivergence +
    breakdown.timezone * WEIGHTS.timezone +
    breakdown.meetingFrequency * WEIGHTS.meetingFrequency +
    breakdown.interests * WEIGHTS.interests;
  
  if (isCurrentlyAvailable) {
    totalScore += AVAILABILITY_BOOST;
  }
  
  const reasons: string[] = [
    ...supportGoals.reasons,
    ...communication.reasons,
    ...guidanceStyle.reasons,
    ...neurodivergence.reasons,
  ];
  
  if (timezone > 0.5) {
    reasons.push('Compatible timezone for scheduling');
  }
  
  if (isCurrentlyAvailable) {
    reasons.push('Available this week');
  }
  
  return {
    mentorId: mentor.id,
    score: totalScore,
    reasons: reasons.slice(0, 4),
    isCurrentlyAvailable,
    breakdown,
  };
};

export const computeLocalMatches = async (
  student: StudentProfile,
  mentors: Mentor[],
  availabilityMap: Map<string, boolean>,
): Promise<LocalMatchResponse> => {
  const matches: LocalMatchResult[] = [];
  
  for (const mentor of mentors) {
    const isAvailable = availabilityMap.get(mentor.id) ?? false;
    const match = computeLocalMatch(student, mentor, isAvailable);
    
    if (match.score > 0) {
      matches.push(match);
    }
  }
  
  matches.sort((a, b) => {
    if (a.isCurrentlyAvailable !== b.isCurrentlyAvailable) {
      return a.isCurrentlyAvailable ? -1 : 1;
    }
    if (Math.abs(a.score - b.score) > 0.01) {
      return b.score - a.score;
    }
    return a.mentorId.localeCompare(b.mentorId);
  });
  
  return {
    matches,
    metadata: {
      totalConsidered: mentors.length,
      totalReturned: matches.length,
      computedAt: new Date().toISOString(),
    },
  };
};
