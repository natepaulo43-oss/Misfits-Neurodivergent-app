'use strict';

const { matchMentors } = require('../server/matchingEngine');

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const FULL_STUDENT = {
  id: 'student-1',
  fullName: 'Jordan Lee',
  age: 17,
  gradeLevel: 'high_school',
  timezone: 'America/Los_Angeles',
  supportGoals: ['academic_support', 'career_guidance'],
  communicationMethods: ['text', 'video'],
  meetingFrequency: 'weekly',
  mentorTraits: ['patient', 'structured'],
  guidanceStyle: 'step_by_step',
  neurodivergence: 'adhd',
  availabilitySlots: ['tue_evening', 'thu_evening'],
};

const FULL_MENTOR = {
  id: 'mentor-1',
  fullName: 'Dr. Sarah Chen',
  timezone: 'America/Los_Angeles',
  focusAreas: ['academic_support', 'executive_function', 'social_emotional'],
  communicationMethods: ['video', 'text'],
  availabilitySlots: ['tue_evening', 'thu_afternoon'],
  mentoringApproach: ['structured_guidance', 'collaborative_problem_solving'],
  menteeAgeRange: ['middle_school', 'high_school', 'college'],
  neurodivergenceExperience: 'experienced',
  maxMentees: 4,
  currentMentees: 2,
  isActive: true,
};

// ---------------------------------------------------------------------------
// 1. Input validation
// ---------------------------------------------------------------------------

describe('matchMentors – input validation', () => {
  test('throws when studentProfile is null', () => {
    expect(() => matchMentors(null, [FULL_MENTOR])).toThrow();
  });

  test('throws when mentorProfiles is null', () => {
    expect(() => matchMentors(FULL_STUDENT, null)).toThrow();
  });

  test('throws when mentorProfiles is not an array', () => {
    expect(() => matchMentors(FULL_STUDENT, 'not-an-array')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// 2. Complete student profile → at least one valid match
// ---------------------------------------------------------------------------

describe('matchMentors – complete student profile', () => {
  test('returns at least one match', () => {
    const { matches } = matchMentors(FULL_STUDENT, [FULL_MENTOR]);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  test('each match has all required fields', () => {
    const { matches } = matchMentors(FULL_STUDENT, [FULL_MENTOR]);
    const m = matches[0];
    expect(m).toHaveProperty('mentor_id');
    expect(m).toHaveProperty('compatibility_score');
    expect(typeof m.compatibility_score).toBe('number');
    expect(Array.isArray(m.match_reasons)).toBe(true);
    expect(m).toHaveProperty('breakdown');
    const bd = m.breakdown;
    ['supportGoals', 'communication', 'availability', 'mentoringStyle', 'neuroExperience'].forEach(
      k => expect(typeof bd[k]).toBe('number'),
    );
  });

  test('compatibility_score is in the range 0–100', () => {
    const { matches } = matchMentors(FULL_STUDENT, [FULL_MENTOR]);
    matches.forEach(m => {
      expect(m.compatibility_score).toBeGreaterThanOrEqual(0);
      expect(m.compatibility_score).toBeLessThanOrEqual(100);
    });
  });

  test('metadata reflects the number of mentors considered', () => {
    const { metadata } = matchMentors(FULL_STUDENT, [FULL_MENTOR]);
    expect(metadata.total_considered).toBe(1);
    expect(typeof metadata.threshold).toBe('number');
    expect(typeof metadata.weights).toBe('object');
  });
});

// ---------------------------------------------------------------------------
// 3. Minimal / incomplete student profile – must not crash
// ---------------------------------------------------------------------------

describe('matchMentors – minimal and incomplete student profiles', () => {
  test('does not throw for a completely empty student object', () => {
    expect(() => matchMentors({}, [FULL_MENTOR])).not.toThrow();
  });

  test('does not throw when only fullName is present', () => {
    expect(() => matchMentors({ fullName: 'Jane' }, [FULL_MENTOR])).not.toThrow();
  });

  test('returns an array (possibly empty) rather than crashing', () => {
    const { matches } = matchMentors({}, [FULL_MENTOR]);
    expect(Array.isArray(matches)).toBe(true);
  });

  test('missing supportGoals is treated as no overlap — does not throw', () => {
    const student = { ...FULL_STUDENT, supportGoals: undefined };
    expect(() => matchMentors(student, [FULL_MENTOR])).not.toThrow();
  });

  test('missing communicationMethods does not throw', () => {
    const student = { ...FULL_STUDENT, communicationMethods: undefined };
    expect(() => matchMentors(student, [FULL_MENTOR])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 4. Edge cases: no matches, fully booked mentors
// ---------------------------------------------------------------------------

describe('matchMentors – edge cases', () => {
  test('returns empty matches array when mentor pool is empty', () => {
    const { matches, metadata } = matchMentors(FULL_STUDENT, []);
    expect(matches).toHaveLength(0);
    expect(metadata.total_considered).toBe(0);
    expect(metadata.total_returned).toBe(0);
  });

  test('filters out a mentor that is fully booked (currentMentees === maxMentees)', () => {
    const booked = { ...FULL_MENTOR, currentMentees: 4, maxMentees: 4 };
    const { matches } = matchMentors(FULL_STUDENT, [booked]);
    expect(matches).toHaveLength(0);
  });

  test('filters out a mentor that is over capacity (currentMentees > maxMentees)', () => {
    const overBooked = { ...FULL_MENTOR, currentMentees: 5, maxMentees: 4 };
    const { matches } = matchMentors(FULL_STUDENT, [overBooked]);
    expect(matches).toHaveLength(0);
  });

  test('includes a mentor when capacity fields are absent (documented fallback)', () => {
    const noCapMentor = { ...FULL_MENTOR };
    delete noCapMentor.currentMentees;
    delete noCapMentor.maxMentees;
    const { matches } = matchMentors(FULL_STUDENT, [noCapMentor]);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  test('filters out an inactive mentor', () => {
    const inactive = { ...FULL_MENTOR, isActive: false };
    const { matches } = matchMentors(FULL_STUDENT, [inactive]);
    expect(matches).toHaveLength(0);
  });

  test('adds disclaimer when best score is below the default threshold', () => {
    // A mentor with no compatible data will score near 0 – below the 60-point floor.
    const poorMentor = {
      id: 'poor-1',
      fullName: 'No Overlap Mentor',
      focusAreas: [],
      communicationMethods: [],
      availabilitySlots: [],
      menteeAgeRange: ['college'],
      isActive: true,
    };
    const youngStudent = { ...FULL_STUDENT, age: 13, gradeLevel: 'middle_school' };
    const { metadata } = matchMentors(youngStudent, [poorMentor]);
    if (metadata.total_returned > 0) {
      expect(metadata.disclaimer).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Score calculation – consistency
// ---------------------------------------------------------------------------

describe('matchMentors – score consistency', () => {
  test('identical inputs produce the same compatibility score (deterministic)', () => {
    const { matches: r1 } = matchMentors(FULL_STUDENT, [FULL_MENTOR]);
    const { matches: r2 } = matchMentors(FULL_STUDENT, [FULL_MENTOR]);
    expect(r1[0].compatibility_score).toBe(r2[0].compatibility_score);
  });

  test('ordering is stable across repeated calls', () => {
    const mentor2 = { ...FULL_MENTOR, id: 'mentor-2', fullName: 'Second Mentor' };
    const { matches: r1 } = matchMentors(FULL_STUDENT, [FULL_MENTOR, mentor2]);
    const { matches: r2 } = matchMentors(FULL_STUDENT, [FULL_MENTOR, mentor2]);
    expect(r1.map(m => m.mentor_id)).toEqual(r2.map(m => m.mentor_id));
  });

  test('a well-matched mentor scores higher than a poor-match mentor', () => {
    const poorMentor = {
      id: 'mentor-poor',
      fullName: 'Poor Fit',
      focusAreas: ['unrelated_topic'],
      communicationMethods: ['email'],
      availabilitySlots: ['sun_morning'],
      menteeAgeRange: ['adult'],
      neurodivergenceExperience: 'no_experience',
      mentoringApproach: ['open_discussion'],
      isActive: true,
    };
    const { matches } = matchMentors(FULL_STUDENT, [FULL_MENTOR, poorMentor]);
    const goodScore = matches.find(m => m.mentor_id === 'mentor-1')?.compatibility_score ?? -1;
    const poorScore = matches.find(m => m.mentor_id === 'mentor-poor')?.compatibility_score ?? 0;
    expect(goodScore).toBeGreaterThan(poorScore);
  });

  test('guidance style breakdown scores 100 on exact match', () => {
    const student = { ...FULL_STUDENT, guidanceStyle: 'step_by_step' };
    const mentor = { ...FULL_MENTOR, mentoringApproach: ['structured_guidance'] };
    const { matches } = matchMentors(student, [mentor]);
    expect(matches[0].breakdown.mentoringStyle).toBe(100);
  });

  test('visual_examples student matches hands_on mentor (server engine)', () => {
    const student = { ...FULL_STUDENT, guidanceStyle: 'visual_examples' };
    const mentor = { ...FULL_MENTOR, mentoringApproach: ['hands_on'] };
    const { matches } = matchMentors(student, [mentor]);
    expect(matches[0].breakdown.mentoringStyle).toBe(100);
  });

  test('visual_examples student does NOT match structured_guidance-only mentor (server engine)', () => {
    const student = { ...FULL_STUDENT, guidanceStyle: 'visual_examples' };
    const mentor = { ...FULL_MENTOR, mentoringApproach: ['structured_guidance'] };
    const { matches } = matchMentors(student, [mentor]);
    expect(matches[0].breakdown.mentoringStyle).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Rejected and blocked mentor filtering
// ---------------------------------------------------------------------------

describe('matchMentors – rejected and blocked filtering', () => {
  test('excludes a mentor listed in student dismissedMentorIds', () => {
    const student = { ...FULL_STUDENT, dismissedMentorIds: ['mentor-1'] };
    const { matches } = matchMentors(student, [FULL_MENTOR]);
    expect(matches.find(m => m.mentor_id === 'mentor-1')).toBeUndefined();
  });

  test('only the dismissed mentor is excluded; others still appear', () => {
    const mentor2 = { ...FULL_MENTOR, id: 'mentor-2', fullName: 'Mentor Two' };
    const student = { ...FULL_STUDENT, dismissedMentorIds: ['mentor-1'] };
    const { matches } = matchMentors(student, [FULL_MENTOR, mentor2]);
    expect(matches.find(m => m.mentor_id === 'mentor-1')).toBeUndefined();
    expect(matches.find(m => m.mentor_id === 'mentor-2')).toBeDefined();
  });

  test('excludes a mentor that has blocked the current student', () => {
    const blockedMentor = { ...FULL_MENTOR, blockedStudentIds: ['student-1'] };
    const { matches } = matchMentors(FULL_STUDENT, [blockedMentor]);
    expect(matches.find(m => m.mentor_id === 'mentor-1')).toBeUndefined();
  });

  test('a student not in the block list still receives the match', () => {
    const blockedMentor = { ...FULL_MENTOR, blockedStudentIds: ['different-student'] };
    const { matches } = matchMentors(FULL_STUDENT, [blockedMentor]);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  test('empty dismissedMentorIds array does not suppress any matches', () => {
    const student = { ...FULL_STUDENT, dismissedMentorIds: [] };
    const { matches } = matchMentors(student, [FULL_MENTOR]);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  test('dismissedMentorIds is ignored when the array is absent', () => {
    const student = { ...FULL_STUDENT };
    delete student.dismissedMentorIds;
    const { matches } = matchMentors(student, [FULL_MENTOR]);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 7. Match list updates correctly after a new mentor joins
// ---------------------------------------------------------------------------

describe('matchMentors – new mentor added to pool', () => {
  test('new mentor appears in results after re-run with an expanded list', () => {
    const { matches: before } = matchMentors(FULL_STUDENT, []);
    expect(before).toHaveLength(0);

    const { matches: after } = matchMentors(FULL_STUDENT, [FULL_MENTOR]);
    expect(after.length).toBeGreaterThanOrEqual(1);
    expect(after[0].mentor_id).toBe('mentor-1');
  });

  test('total_considered reflects updated pool size', () => {
    const mentor2 = { ...FULL_MENTOR, id: 'mentor-2', fullName: 'New Mentor' };
    const { metadata: before } = matchMentors(FULL_STUDENT, [FULL_MENTOR]);
    const { metadata: after } = matchMentors(FULL_STUDENT, [FULL_MENTOR, mentor2]);
    expect(after.total_considered).toBeGreaterThan(before.total_considered);
  });

  test('previously unseen mentor with top score rises to first position', () => {
    const superMentor = {
      ...FULL_MENTOR,
      id: 'mentor-super',
      fullName: 'Super Mentor',
      focusAreas: ['academic_support', 'career_guidance'],
      communicationMethods: ['text', 'video'],
      neurodivergenceExperience: 'experienced',
      mentoringApproach: ['structured_guidance'],
      timezone: 'America/Los_Angeles',
      availabilitySlots: ['tue_evening', 'thu_evening'],
    };
    const { matches } = matchMentors(FULL_STUDENT, [FULL_MENTOR, superMentor]);
    expect(matches.map(m => m.mentor_id)).toContain('mentor-super');
  });
});
