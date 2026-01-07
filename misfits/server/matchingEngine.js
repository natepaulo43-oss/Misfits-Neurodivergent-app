const DEFAULT_WEIGHTS = {
  supportGoals: 40,
  communication: 20,
  availability: 15,
  mentoringStyle: 15,
  neuroExperience: 10,
};

const SCORE_THRESHOLD = 60;
const MIN_RESULTS = 3;
const MAX_RESULTS = 5;

const GUIDANCE_TO_APPROACH = {
  step_by_step: ['structured_guidance'],
  open_discussion: ['open_discussion', 'collaborative_problem_solving'],
  visual_examples: ['hands_on', 'collaborative_problem_solving'],
  trial_error: ['hands_on', 'collaborative_problem_solving'],
};

const GRADE_TO_AGE_RANGE = {
  middle_school: 'middle_school',
  high_school: 'high_school',
  college: 'college',
  other: 'adult',
};

const getArray = value => (Array.isArray(value) ? value : []);

const calcOverlapScore = (preferred, offered) => {
  const studentChoices = getArray(preferred);
  if (!studentChoices.length) return 0;

  const mentorValues = new Set(getArray(offered));
  if (!mentorValues.size) return 0;

  const overlapCount = studentChoices.filter(choice => mentorValues.has(choice)).length;
  return Math.round((overlapCount / studentChoices.length) * 100);
};

const hasAvailabilityOverlap = (student, mentor) => {
  const studentSlots = getArray(student.availabilitySlots);
  const mentorSlots = getArray(mentor.availabilitySlots);

  if (!studentSlots.length || !mentorSlots.length) {
    // Do not block match if either side has not provided availability yet.
    return true;
  }

  return studentSlots.some(slot => mentorSlots.includes(slot));
};

const determineStudentAgeBucket = student => {
  if (student?.age) {
    if (student.age < 15) return 'middle_school';
    if (student.age < 19) return 'high_school';
    if (student.age < 23) return 'college';
    return 'adult';
  }

  if (student?.gradeLevel && GRADE_TO_AGE_RANGE[student.gradeLevel]) {
    return GRADE_TO_AGE_RANGE[student.gradeLevel];
  }

  return null;
};

const withinMentorAgeRange = (student, mentor) => {
  const studentBucket = determineStudentAgeBucket(student);
  const mentorRanges = getArray(mentor.menteeAgeRange);

  if (!studentBucket || !mentorRanges.length) return true;

  return mentorRanges.includes(studentBucket);
};

const mentorIsActiveAndAvailable = mentor => {
  if (mentor == null || typeof mentor !== 'object') return false;

  if (mentor.isActive === false || mentor.active === false || mentor.status === 'inactive') {
    return false;
  }

  const current = mentor.currentMentees ?? mentor.activeMentees ?? mentor.matchesAssigned;
  const capacity = mentor.maxMentees ?? mentor.capacity ?? mentor.matchCapacity;

  if (typeof current === 'number' && typeof capacity === 'number') {
    return current < capacity;
  }

  return true;
};

const getTimezoneOffsetHours = timeZone => {
  if (!timeZone) return null;

  try {
    const now = new Date();
    const localeString = now.toLocaleString('en-US', { timeZone });
    const tzDate = new Date(localeString);
    return (now.getTime() - tzDate.getTime()) / (1000 * 60 * 60);
  } catch (error) {
    return null;
  }
};

const calcTimezoneScore = (studentTz, mentorTz) => {
  const studentOffset = getTimezoneOffsetHours(studentTz);
  const mentorOffset = getTimezoneOffsetHours(mentorTz);

  if (studentOffset == null || mentorOffset == null) {
    return 50; // Neutral when we cannot determine timezone offsets.
  }

  const diff = Math.abs(studentOffset - mentorOffset);

  if (diff < 0.5) return 100;
  if (diff <= 1) return 85;
  if (diff <= 2) return 70;
  if (diff <= 3) return 55;

  return 30;
};

const calcAvailabilityScore = (student, mentor) => {
  const timezoneScore = calcTimezoneScore(student?.timezone, mentor?.timezone);
  const slotScore = getArray(student?.availabilitySlots).length
    ? calcOverlapScore(student.availabilitySlots, mentor.availabilitySlots)
    : 50; // Neutral if student has not provided slots yet.

  return Math.round(timezoneScore * 0.7 + slotScore * 0.3);
};

const calcMentoringStyleScore = (student, mentor) => {
  const desiredStyle = student?.guidanceStyle;
  const mentorApproach = getArray(mentor?.mentoringApproach);

  if (!desiredStyle || !mentorApproach.length) return 0;

  const acceptableApproaches = GUIDANCE_TO_APPROACH[desiredStyle] ?? [];
  if (!acceptableApproaches.length) return 0;

  return mentorApproach.some(approach => acceptableApproaches.includes(approach)) ? 100 : 0;
};

const calcNeurodivergenceScore = (student, mentor) => {
  const studentPref = student?.neurodivergence;
  const mentorExperience = mentor?.neurodivergenceExperience;

  if (!studentPref || studentPref === 'prefer_not_to_say') {
    return 50;
  }

  if (!mentorExperience) return 0;

  const experiencedValues = new Set(['experienced', 'some_experience', 'self_identified']);
  return experiencedValues.has(mentorExperience) ? 100 : 0;
};

const deterministicJitter = identifier => {
  if (!identifier) return 0;

  let hash = 0;
  for (let i = 0; i < identifier.length; i += 1) {
    hash = (hash * 31 + identifier.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 100000; // Max +0.00999
};

const buildMatchReasons = breakdown => {
  const reasons = [];

  if (breakdown.supportGoals >= 60) {
    reasons.push('Aligned support goals and mentor expertise');
  }
  if (breakdown.communication >= 60) {
    reasons.push('Matching communication preferences');
  }
  if (breakdown.availability >= 60) {
    reasons.push('Compatible availability and time zones');
  }
  if (breakdown.mentoringStyle >= 60) {
    reasons.push('Mentoring style fits requested guidance');
  }
  if (breakdown.neuroExperience >= 60) {
    reasons.push('Experienced supporting neurodivergent students');
  }

  return reasons;
};

const normalizeWeights = weights => {
  const merged = { ...DEFAULT_WEIGHTS, ...(weights || {}) };
  const total = Object.values(merged).reduce((sum, value) => sum + value, 0);

  if (!total) {
    return { ...DEFAULT_WEIGHTS };
  }

  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [key, (value / total) * 100]),
  );
};

const sumWeightedScore = (weights, breakdown) =>
  Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + (breakdown[key] ?? 0) * (weight / 100),
    0,
  );

const passesHardFilters = (student, mentor) =>
  hasAvailabilityOverlap(student, mentor) &&
  withinMentorAgeRange(student, mentor) &&
  mentorIsActiveAndAvailable(mentor);

const computeComponentBreakdown = (student, mentor) => ({
  supportGoals: calcOverlapScore(student?.supportGoals, mentor?.focusAreas ?? mentor?.expertiseAreas),
  communication: calcOverlapScore(student?.communicationMethods, mentor?.communicationMethods),
  availability: calcAvailabilityScore(student, mentor),
  mentoringStyle: calcMentoringStyleScore(student, mentor),
  neuroExperience: calcNeurodivergenceScore(student, mentor),
});

const matchMentors = (studentProfile, mentorProfiles, options = {}) => {
  if (!studentProfile || !Array.isArray(mentorProfiles)) {
    throw new Error('studentProfile and mentorProfiles are required inputs.');
  }

  const weights = normalizeWeights(options.weights);
  const threshold = typeof options.threshold === 'number' ? options.threshold : SCORE_THRESHOLD;
  const minResults = Math.max(options.minResults || MIN_RESULTS, 1);
  const maxResults = Math.min(options.maxResults || MAX_RESULTS, 10);

  const scoredMentors = mentorProfiles
    .filter(mentor => passesHardFilters(studentProfile, mentor))
    .map(mentor => {
      const breakdown = computeComponentBreakdown(studentProfile, mentor);
      const baseScore = sumWeightedScore(weights, breakdown);
      const jitter = deterministicJitter(mentor.id || mentor.mentor_id || mentor.fullName || '');
      const compatibilityScore = Math.round((baseScore + jitter) * 100) / 100;

      return {
        mentor_id: mentor.id || mentor.mentor_id || mentor.fullName,
        mentor_name: mentor.fullName || mentor.name,
        compatibility_score: compatibilityScore,
        match_reasons: buildMatchReasons(breakdown),
        breakdown,
      };
    })
    .sort((a, b) => b.compatibility_score - a.compatibility_score);

  const desiredCount = Math.min(
    maxResults,
    Math.max(minResults, Math.min(scoredMentors.length, maxResults)),
  );
  const matches = scoredMentors.slice(0, desiredCount);

  const bestScore = matches[0]?.compatibility_score ?? 0;
  const disclaimer =
    bestScore < threshold
      ? 'No mentors met the preferred compatibility threshold; showing best available matches.'
      : undefined;

  return {
    matches,
    metadata: {
      weights,
      threshold,
      disclaimer,
      total_considered: mentorProfiles.length,
      total_returned: matches.length,
    },
  };
};

module.exports = {
  matchMentors,
  DEFAULT_WEIGHTS,
  SCORE_THRESHOLD,
};
