import { Mentor, StudentProfile, MentorMatchResult, MentorMatchMetadata } from '../types';
import Constants from 'expo-constants';

const MATCHING_API_URL = Constants.expoConfig?.extra?.matchingApiUrl || process.env.EXPO_PUBLIC_MATCHING_API_URL;

if (!MATCHING_API_URL) {
  console.warn(
    'Missing EXPO_PUBLIC_MATCHING_API_URL environment variable. Matching requests will fail.',
  );
}

interface MatchResponse {
  matches: MentorMatchResult[];
  metadata: MentorMatchMetadata;
}

const sanitizeMentorProfiles = (mentors: Mentor[]) =>
  mentors
    .filter((mentor): mentor is Mentor & { mentorProfile: NonNullable<Mentor['mentorProfile']> } =>
      Boolean(mentor.mentorProfile),
    )
    .map(mentor => {
      const profile = mentor.mentorProfile;
      return {
        id: mentor.id,
        fullName: profile.fullName || mentor.name,
        timezone: profile.timezone,
        currentRole: profile.currentRole,
        expertiseAreas: profile.expertiseAreas,
        menteeAgeRange: profile.menteeAgeRange,
        focusAreas: profile.focusAreas,
        neurodivergenceExperience: profile.neurodivergenceExperience,
        communicationMethods: profile.communicationMethods,
        availabilitySlots: profile.availabilitySlots,
        mentoringApproach: profile.mentoringApproach,
        valuedMenteeTraits: profile.valuedMenteeTraits,
        isActive: mentor.approved,
        profileImage: mentor.profileImage,
      };
    });

export const fetchMentorMatches = async (
  studentProfile: StudentProfile,
  mentorProfiles: Mentor[],
): Promise<MatchResponse> => {
  if (!MATCHING_API_URL) {
    throw new Error('Matching API URL is not configured.');
  }

  const payloadMentors = sanitizeMentorProfiles(mentorProfiles);

  const response = await fetch(`${MATCHING_API_URL}/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      student_profile: studentProfile,
      mentor_profiles: payloadMentors,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(
      errorPayload?.message ||
        'Unable to fetch mentor matches. Please try again in a few minutes.',
    );
  }

  const data = (await response.json()) as MatchResponse;
  return data;
};
