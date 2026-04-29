import { computeLocalMatch, computeLocalMatches, LocalMatchResult } from '../services/matchingLocal';
import type { Mentor, StudentProfile } from '../types';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const FULL_STUDENT: StudentProfile = {
  fullName: 'Jordan Lee',
  gradeLevel: 'high_school',
  locationCity: 'Los Angeles',
  locationState: 'CA',
  timezone: 'America/Los_Angeles',
  supportGoals: ['academic_support'],
  learningStyles: ['visual'],
  communicationMethods: ['video', 'text'],
  meetingFrequency: 'weekly',
  mentorTraits: ['patient', 'structured'],
  guidanceStyle: 'step_by_step',
  neurodivergence: 'adhd',
  availabilitySlots: ['tue_evening'],
};

const FULL_MENTOR: Mentor = {
  id: 'mentor-1',
  name: 'Dr. Sarah Chen',
  bio: 'Educational psychologist',
  expertise: ['ADHD Coaching', 'Study Skills'],
  approved: true,
  mentorProfile: {
    fullName: 'Dr. Sarah Chen',
    locationCity: 'Los Angeles',
    locationState: 'CA',
    timezone: 'America/Los_Angeles',
    currentRole: 'Educational Psychologist',
    expertiseAreas: ['ADHD Coaching', 'Study Skills', 'Executive Function'],
    menteeAgeRange: ['middle_school', 'high_school', 'college'],
    focusAreas: ['academic_support', 'executive_function', 'social_emotional'],
    neurodivergenceExperience: 'experienced',
    communicationMethods: ['video', 'text'],
    availabilitySlots: ['tue_evening', 'thu_afternoon'],
    mentoringApproach: ['structured_guidance', 'collaborative_problem_solving'],
    valuedMenteeTraits: ['motivated', 'curious'],
  },
};

const MENTOR_NO_PROFILE: Mentor = {
  id: 'mentor-no-profile',
  name: 'No Profile Mentor',
  bio: '',
  expertise: [],
  approved: true,
};

const makeAvailabilityMap = (ids: string[], value: boolean): Map<string, boolean> =>
  new Map(ids.map(id => [id, value]));

// ---------------------------------------------------------------------------
// 1. computeLocalMatch – single-mentor scoring
// ---------------------------------------------------------------------------

describe('computeLocalMatch – single-mentor scoring', () => {
  test('complete student + complete mentor → score > 0', () => {
    const result = computeLocalMatch(FULL_STUDENT, FULL_MENTOR, false);
    expect(result.score).toBeGreaterThan(0);
  });

  test('availability boost increases score when mentor is currently available', () => {
    const unavailable = computeLocalMatch(FULL_STUDENT, FULL_MENTOR, false);
    const available = computeLocalMatch(FULL_STUDENT, FULL_MENTOR, true);
    expect(available.score).toBeGreaterThan(unavailable.score);
  });

  test('mentor without mentorProfile returns score of 0', () => {
    const result = computeLocalMatch(FULL_STUDENT, MENTOR_NO_PROFILE, false);
    expect(result.score).toBe(0);
    expect(result.mentorId).toBe('mentor-no-profile');
  });

  test('result has all breakdown fields', () => {
    const result = computeLocalMatch(FULL_STUDENT, FULL_MENTOR, false);
    const keys = ['supportGoals', 'communication', 'guidanceStyle', 'neurodivergence', 'timezone', 'meetingFrequency', 'interests'];
    keys.forEach(k => expect(typeof (result.breakdown as Record<string, number>)[k]).toBe('number'));
  });

  test('reasons array has at most 4 entries', () => {
    const result = computeLocalMatch(FULL_STUDENT, FULL_MENTOR, false);
    expect(result.reasons.length).toBeLessThanOrEqual(4);
  });

  test('isCurrentlyAvailable is reflected correctly in the result', () => {
    const r1 = computeLocalMatch(FULL_STUDENT, FULL_MENTOR, true);
    const r2 = computeLocalMatch(FULL_STUDENT, FULL_MENTOR, false);
    expect(r1.isCurrentlyAvailable).toBe(true);
    expect(r2.isCurrentlyAvailable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Guidance style consistency – visual_examples (Bug fix verification)
// ---------------------------------------------------------------------------

describe('computeLocalMatch – visual_examples guidance alignment with server engine', () => {
  test('visual_examples student MATCHES a hands_on mentor', () => {
    const student = { ...FULL_STUDENT, guidanceStyle: 'visual_examples' as const };
    const mentor: Mentor = {
      ...FULL_MENTOR,
      mentorProfile: { ...FULL_MENTOR.mentorProfile!, mentoringApproach: ['hands_on'] },
    };
    const result = computeLocalMatch(student, mentor, false);
    expect(result.breakdown.guidanceStyle).toBeGreaterThan(0);
  });

  test('visual_examples student MATCHES a collaborative_problem_solving mentor', () => {
    const student = { ...FULL_STUDENT, guidanceStyle: 'visual_examples' as const };
    const mentor: Mentor = {
      ...FULL_MENTOR,
      mentorProfile: { ...FULL_MENTOR.mentorProfile!, mentoringApproach: ['collaborative_problem_solving'] },
    };
    const result = computeLocalMatch(student, mentor, false);
    expect(result.breakdown.guidanceStyle).toBeGreaterThan(0);
  });

  test('visual_examples student does NOT match a structured_guidance-only mentor', () => {
    const student = { ...FULL_STUDENT, guidanceStyle: 'visual_examples' as const };
    const mentor: Mentor = {
      ...FULL_MENTOR,
      mentorProfile: { ...FULL_MENTOR.mentorProfile!, mentoringApproach: ['structured_guidance'] },
    };
    const result = computeLocalMatch(student, mentor, false);
    expect(result.breakdown.guidanceStyle).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. computeLocalMatches – complete profile → at least one match
// ---------------------------------------------------------------------------

describe('computeLocalMatches – complete profile', () => {
  test('returns at least one match for a complete student profile', async () => {
    const availMap = makeAvailabilityMap([FULL_MENTOR.id], false);
    const result = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR], availMap);
    expect(result.matches.length).toBeGreaterThanOrEqual(1);
  });

  test('metadata totalReturned matches matches array length', async () => {
    const availMap = makeAvailabilityMap([FULL_MENTOR.id], false);
    const result = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR], availMap);
    expect(result.metadata.totalReturned).toBe(result.matches.length);
  });

  test('metadata totalConsidered equals input mentor count', async () => {
    const availMap = makeAvailabilityMap([FULL_MENTOR.id], false);
    const result = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR], availMap);
    expect(result.metadata.totalConsidered).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 4. Minimal / incomplete student profile – must not crash
// ---------------------------------------------------------------------------

describe('computeLocalMatches – minimal and incomplete profiles', () => {
  test('does not throw for a student with only required primitive fields', async () => {
    const minimal = {
      fullName: 'Minimal',
      gradeLevel: 'high_school',
      locationCity: 'NYC',
      locationState: 'NY',
      supportGoals: [],
      learningStyles: [],
      communicationMethods: [],
      meetingFrequency: 'weekly',
      mentorTraits: [],
    } as unknown as StudentProfile;
    const availMap = makeAvailabilityMap([FULL_MENTOR.id], false);
    await expect(computeLocalMatches(minimal, [FULL_MENTOR], availMap)).resolves.toBeDefined();
  });

  test('returns an array (possibly empty) — never crashes on missing optional fields', async () => {
    const bare = {} as unknown as StudentProfile;
    const availMap = makeAvailabilityMap([FULL_MENTOR.id], false);
    const result = await computeLocalMatches(bare, [FULL_MENTOR], availMap);
    expect(Array.isArray(result.matches)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Edge cases: no matches, all mentors unavailable
// ---------------------------------------------------------------------------

describe('computeLocalMatches – edge cases', () => {
  test('returns empty matches when mentor pool is empty', async () => {
    const result = await computeLocalMatches(FULL_STUDENT, [], new Map());
    expect(result.matches).toHaveLength(0);
    expect(result.metadata.totalConsidered).toBe(0);
  });

  test('mentors with no profile are excluded (score = 0)', async () => {
    const availMap = makeAvailabilityMap([MENTOR_NO_PROFILE.id], false);
    const result = await computeLocalMatches(FULL_STUDENT, [MENTOR_NO_PROFILE], availMap);
    expect(result.matches).toHaveLength(0);
  });

  test('all mentors fully booked (unavailable) still appear but without availability flag', async () => {
    const availMap = makeAvailabilityMap([FULL_MENTOR.id], false);
    const result = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR], availMap);
    // Mentor is present but marked unavailable
    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    expect(result.matches[0].isCurrentlyAvailable).toBe(false);
  });

  test('available mentors are sorted before unavailable ones', async () => {
    const mentor2: Mentor = { ...FULL_MENTOR, id: 'mentor-2' };
    const availMap = new Map([
      ['mentor-1', false],
      ['mentor-2', true],
    ]);
    const result = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR, mentor2], availMap);
    if (result.matches.length >= 2) {
      const firstAvailable = result.matches.findIndex(m => m.isCurrentlyAvailable);
      const firstUnavailable = result.matches.findIndex(m => !m.isCurrentlyAvailable);
      expect(firstAvailable).toBeLessThan(firstUnavailable);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Score consistency (determinism)
// ---------------------------------------------------------------------------

describe('computeLocalMatches – score consistency', () => {
  test('same inputs produce identical scores across two calls', async () => {
    const availMap = makeAvailabilityMap([FULL_MENTOR.id], false);
    const r1 = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR], availMap);
    const r2 = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR], availMap);
    expect(r1.matches[0].score).toBe(r2.matches[0].score);
  });

  test('ordering is stable across repeated calls', async () => {
    const mentor2: Mentor = { ...FULL_MENTOR, id: 'mentor-2' };
    const availMap = makeAvailabilityMap(['mentor-1', 'mentor-2'], false);
    const r1 = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR, mentor2], availMap);
    const r2 = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR, mentor2], availMap);
    expect(r1.matches.map(m => m.mentorId)).toEqual(r2.matches.map(m => m.mentorId));
  });
});

// ---------------------------------------------------------------------------
// 7. Rejected and blocked mentor filtering
// ---------------------------------------------------------------------------

describe('computeLocalMatches – rejected and blocked filtering', () => {
  test('excludes a mentor in student dismissedMentorIds', async () => {
    const student: StudentProfile = { ...FULL_STUDENT, dismissedMentorIds: ['mentor-1'] };
    const availMap = makeAvailabilityMap([FULL_MENTOR.id], false);
    const result = await computeLocalMatches(student, [FULL_MENTOR], availMap);
    expect(result.matches.find(m => m.mentorId === 'mentor-1')).toBeUndefined();
  });

  test('only the dismissed mentor is excluded; others still appear', async () => {
    const mentor2: Mentor = { ...FULL_MENTOR, id: 'mentor-2' };
    const student: StudentProfile = { ...FULL_STUDENT, dismissedMentorIds: ['mentor-1'] };
    const availMap = makeAvailabilityMap(['mentor-1', 'mentor-2'], false);
    const result = await computeLocalMatches(student, [FULL_MENTOR, mentor2], availMap);
    expect(result.matches.find(m => m.mentorId === 'mentor-1')).toBeUndefined();
    expect(result.matches.find(m => m.mentorId === 'mentor-2')).toBeDefined();
  });

  test('excludes a mentor that has blocked the current student (via currentStudentId)', async () => {
    const blockedMentor: Mentor = {
      ...FULL_MENTOR,
      mentorProfile: { ...FULL_MENTOR.mentorProfile!, blockedStudentIds: ['student-abc'] },
    };
    const availMap = makeAvailabilityMap([blockedMentor.id], false);
    const result = await computeLocalMatches(FULL_STUDENT, [blockedMentor], availMap, 'student-abc');
    expect(result.matches.find(m => m.mentorId === 'mentor-1')).toBeUndefined();
  });

  test('a different student not in the block list still receives the match', async () => {
    const blockedMentor: Mentor = {
      ...FULL_MENTOR,
      mentorProfile: { ...FULL_MENTOR.mentorProfile!, blockedStudentIds: ['other-student'] },
    };
    const availMap = makeAvailabilityMap([blockedMentor.id], false);
    const result = await computeLocalMatches(FULL_STUDENT, [blockedMentor], availMap, 'student-1');
    expect(result.matches.length).toBeGreaterThanOrEqual(1);
  });

  test('no filtering when dismissedMentorIds is empty', async () => {
    const student: StudentProfile = { ...FULL_STUDENT, dismissedMentorIds: [] };
    const availMap = makeAvailabilityMap([FULL_MENTOR.id], false);
    const result = await computeLocalMatches(student, [FULL_MENTOR], availMap);
    expect(result.matches.length).toBeGreaterThanOrEqual(1);
  });

  test('no filtering when currentStudentId is not provided', async () => {
    const blockedMentor: Mentor = {
      ...FULL_MENTOR,
      mentorProfile: { ...FULL_MENTOR.mentorProfile!, blockedStudentIds: ['anyone'] },
    };
    const availMap = makeAvailabilityMap([blockedMentor.id], false);
    // No studentId passed → mentor-side block cannot be applied → mentor appears
    const result = await computeLocalMatches(FULL_STUDENT, [blockedMentor], availMap);
    expect(result.matches.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 8. Match list updates after a new mentor joins
// ---------------------------------------------------------------------------

describe('computeLocalMatches – new mentor joins pool', () => {
  test('new mentor appears in results after re-run with an expanded list', async () => {
    const empty = await computeLocalMatches(FULL_STUDENT, [], new Map());
    expect(empty.matches).toHaveLength(0);

    const availMap = makeAvailabilityMap([FULL_MENTOR.id], false);
    const withMentor = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR], availMap);
    expect(withMentor.matches.length).toBeGreaterThanOrEqual(1);
    expect(withMentor.matches[0].mentorId).toBe('mentor-1');
  });

  test('totalConsidered grows when more mentors are added', async () => {
    const mentor2: Mentor = { ...FULL_MENTOR, id: 'mentor-2' };
    const availMap1 = makeAvailabilityMap([FULL_MENTOR.id], false);
    const availMap2 = makeAvailabilityMap(['mentor-1', 'mentor-2'], false);
    const r1 = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR], availMap1);
    const r2 = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR, mentor2], availMap2);
    expect(r2.metadata.totalConsidered).toBeGreaterThan(r1.metadata.totalConsidered);
  });

  test('highly available new mentor appears near top of results', async () => {
    const newMentor: Mentor = {
      ...FULL_MENTOR,
      id: 'mentor-new',
    };
    // New mentor is available; existing mentor is not
    const availMap = new Map([
      ['mentor-1', false],
      ['mentor-new', true],
    ]);
    const result = await computeLocalMatches(FULL_STUDENT, [FULL_MENTOR, newMentor], availMap);
    expect(result.matches[0].mentorId).toBe('mentor-new');
  });
});
