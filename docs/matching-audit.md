# Mentor-Student Matching System Audit

## Date: 2026-01-15

## 1. Profile Storage

### Collections:
- **Primary Collection**: `users` (Firestore)
- **Availability Collection**: `mentorAvailability` (Firestore)
- **Sessions Collection**: `sessions` (Firestore)

### Key Fields:

#### Student Profile (`User.studentProfile: StudentProfile`)
- `fullName`, `age`, `gradeLevel`
- `locationCity`, `locationState`, `timezone`
- `availabilitySlots` (legacy string array)
- `supportGoals` (array: academic_support, social_emotional, career_guidance, other)
- `supportGoalsOther` (string)
- `learningStyles` (array: visual, auditory, reading_writing, hands_on)
- `communicationMethods` (array: text, video, audio, email)
- `meetingFrequency` (weekly, biweekly, monthly)
- `mentorTraits` (array: patient, structured, creative, empathetic, goal_oriented, experienced)
- `guidanceStyle` (step_by_step, open_discussion, visual_examples, trial_error)
- `preferredCommunicationNotes` (string)
- `neurodivergence` (adhd, autism, dyslexia, other, prefer_not_to_say)
- `strengthsText`, `challengesText`

#### Mentor Profile (`User.mentorProfile: MentorProfile`)
- `fullName`, `age`, `currentRole`
- `locationCity`, `locationState`, `timezone`
- `expertiseAreas` (string array)
- `menteeAgeRange` (array: middle_school, high_school, college, adult)
- `focusAreas` (string array)
- `neurodivergenceExperience` (experienced, some_experience, no_experience, self_identified)
- `communicationMethods` (array: text, video, audio, email)
- `availabilitySlots` (legacy string array - NOT USED for scheduling)
- `mentoringApproach` (array: structured_guidance, open_discussion, collaborative_problem_solving, hands_on)
- `valuedMenteeTraits` (array: motivated, curious, communicative, self_directed)
- `shortBio`, `funFact`
- `acceptingIntroRequests` (boolean, default true)

## 2. Mentor Approval Status

**Field**: `User.role` and `User.mentorApplicationStatus`

### Approval Flow:
1. User applies → `pendingRole: 'mentor'`, `mentorApplicationStatus: 'submitted'`
2. Admin approves → `role: 'mentor'`, `mentorApplicationStatus: 'approved'`, `pendingRole: null`
3. Admin rejects → `mentorApplicationStatus: 'rejected'`

### Filtering Logic:
- Approved mentors: `role === 'mentor'` AND `mentorApplicationStatus === 'approved'`
- Additional filters in `services/mentors.ts`:
  - `approved !== false`
  - `mentorMatchingDisabled !== true`
  - Must have `mentorProfile` object

## 3. Existing Matching Engine

**Location**: `misfits/services/matching.ts`

### Current Implementation:
- **Type**: External API call (NOT local/deterministic)
- **Endpoint**: `EXPO_PUBLIC_MATCHING_API_URL/match`
- **Method**: POST with student profile + mentor profiles
- **Returns**: `MentorMatchResult[]` with scores and reasons

### Issues:
- ❌ Requires external API (not deterministic, requires network)
- ❌ Not explainable locally
- ❌ Does NOT check availability
- ✅ Already returns match reasons and breakdown
- ✅ Used in `app/(tabs)/mentors/index.tsx`

### Match Result Structure:
```typescript
{
  mentor_id: string;
  compatibility_score: number;
  match_reasons: string[];
  breakdown: {
    supportGoals: number;
    communication: number;
    availability: number;
    mentoringStyle: number;
    neuroExperience: number;
  }
}
```

## 4. Student Mentors Screen

**Location**: `misfits/app/(tabs)/mentors/index.tsx`

### Current Behavior:
- Shows top 5 matches from API
- Displays match reasons as bullet points
- Shows "Strong Fit" / "Good Fit" / "Potential Fit" labels
- Has "Browse all mentors" button → `browse.tsx`
- No "Best Fits" section (just shows matches)
- No availability badge/indicator

### Browse Screen:
**Location**: `misfits/app/(tabs)/mentors/browse.tsx`
- Shows all approved mentors in flat list
- No filtering or search yet
- Simple card view with avatar + bio + expertise tags

## 5. Availability System

**Status**: ✅ FULLY IMPLEMENTED

### Storage:
- **Collection**: `mentorAvailability`
- **Document ID**: `mentorId`

### Schema (`MentorAvailability`):
```typescript
{
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
```

### Weekly Blocks:
```typescript
{
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "HH:MM" format
  endTime: string;
}
```

### Slot Generation:
- **Function**: `generateTimeSlots()` in `utils/scheduling.ts`
- Generates available slots for a given date
- Respects buffer times, max sessions per day, exceptions
- Filters out booked sessions

### Integration:
- Mentors set availability via `app/(tabs)/availability-setup.tsx`
- Students book via `app/(tabs)/book-session.tsx`
- Sessions stored in `sessions` collection

## SUMMARY

### ✅ What Exists:
1. Complete user profile schema with rich matching fields
2. Mentor approval workflow
3. External matching API (but not local/deterministic)
4. Full availability system with slot generation
5. Mentors screen showing matches
6. Browse all mentors screen

### ❌ What's Missing:
1. **Local deterministic matching engine** (currently uses external API)
2. **Availability check in matching** (API doesn't consider real availability)
3. **"Best Fits" section** with availability badges
4. **Duplicate removal** between Best Fits and All Mentors
5. **Explainable match reasons** tied to actual profile fields
6. **Search/filter on browse screen**

### 🔧 What Needs to Change:
1. Create new local matching service (`services/matchingLocal.ts`)
2. Add availability check helper (`hasUpcomingSlotsInNext7Days()`)
3. Update mentors index screen to show Best Fits section
4. Add availability badges to mentor cards
5. Keep external API as fallback/comparison (optional)

## NEXT STEPS:
1. Implement local matching engine with scoring rules
2. Implement availability check for next 7 days
3. Update UI to show Best Fits section
4. Add tests and validation
