# Mentor-Student Matching Validation Guide

## Manual Test Checklist

### Test 1: Student with Strong Matches
**Setup:**
- Create/use a student profile with:
  - Support goals: `academic_support`, `career_guidance`
  - Learning styles: `visual`, `hands_on`
  - Communication methods: `video`, `text`
  - Guidance style: `step_by_step`
  - Neurodivergence: `adhd`
  - Timezone: `America/New_York`

**Expected:**
- Best Fits section shows mentors with matching focus areas
- Match reasons include "Matches your support goals: academic support, career guidance"
- Mentors with `structured_guidance` approach appear
- Mentors with neurodivergence experience ranked higher
- Available mentors appear before unavailable ones

**Validation:**
```
✓ Best Fits section visible
✓ 1-5 mentor cards displayed
✓ Each card shows 2-4 match reasons
✓ Availability badge shows "Available this week" or "No slots this week"
✓ Available mentors sorted to top
```

---

### Test 2: Mentors Without Availability
**Setup:**
- Ensure some mentors have NOT set up availability
- Or have availability but no slots in next 7 days

**Expected:**
- Mentors still appear in Best Fits if they match profile
- Badge shows "No slots this week"
- Ranked lower than available mentors with similar scores
- Can still view profile and request intro

**Validation:**
```
✓ Unavailable mentors shown with gray badge
✓ Available mentors appear first in list
✓ All buttons functional for unavailable mentors
```

---

### Test 3: No Approved Mentors
**Setup:**
- Test environment with no approved mentors
- Or all mentors have `mentorMatchingDisabled: true`

**Expected:**
- Empty state message: "We're still searching"
- Friendly copy explaining situation
- Refresh button available
- Browse all mentors button shows 0 mentors

**Validation:**
```
✓ Empty state card displayed
✓ No error thrown
✓ Refresh button works
✓ Browse button navigates correctly
```

---

### Test 4: Mentor Becomes Available
**Setup:**
1. Load matches (mentor shows "No slots this week")
2. Mentor sets up availability with slots in next 7 days
3. Student refreshes matches

**Expected:**
- Mentor badge updates to "Available this week"
- Mentor rises in ranking (if score is competitive)
- Match reasons include "Available this week"

**Validation:**
```
✓ Pull-to-refresh works
✓ Availability status updates
✓ Ranking adjusts correctly
```

---

### Test 5: Role Restrictions
**Setup:**
- Test as student, mentor, and admin

**Expected:**
- **Student**: Sees Best Fits + Browse all mentors
- **Mentor**: Sees intro requests console (different view)
- **Admin**: Should see student view if they have student profile

**Validation:**
```
✓ Students see matching UI
✓ Mentors see intro console
✓ No unauthorized data access
```

---

### Test 6: Duplicate Prevention
**Setup:**
- Load matches with 5+ mentors

**Expected:**
- Mentors in Best Fits do NOT appear in "Browse all mentors" count
- Browse button shows correct remaining count
- No duplicate mentor cards on screen

**Validation:**
```
✓ Best Fits shows 5 mentors
✓ Browse count = total - 5
✓ No visual duplicates
```

---

### Test 7: Match Reason Accuracy
**Setup:**
- Student with specific profile attributes
- Mentor with matching attributes

**Expected Match Reasons:**
- Support goals match → "Matches your support goals: [list]"
- Communication overlap → "Supports video, text communication"
- Guidance style match → "Mentoring style matches your [style] preference"
- Neuro experience → "Experienced with neurodivergent learners"
- Timezone compatible → "Compatible timezone for scheduling"
- Available → "Available this week"

**Validation:**
```
✓ Reasons are specific and accurate
✓ No generic/vague reasons
✓ Max 4 reasons per mentor
✓ Reasons match actual profile overlap
```

---

### Test 8: Performance
**Setup:**
- 20+ approved mentors in database

**Expected:**
- Initial load < 3 seconds
- Pull-to-refresh < 2 seconds
- No UI freezing during computation
- Smooth scrolling

**Validation:**
```
✓ Fast initial load
✓ No janky animations
✓ Loading spinner shows during fetch
✓ Error handling graceful
```

---

## Automated Test Cases

### Unit Tests for Matching Engine

Create `__tests__/matchingLocal.test.ts`:

```typescript
import { computeLocalMatch } from '../services/matchingLocal';
import { StudentProfile, Mentor } from '../types';

describe('Local Matching Engine', () => {
  const mockStudent: StudentProfile = {
    fullName: 'Test Student',
    gradeLevel: 'high_school',
    locationCity: 'New York',
    locationState: 'NY',
    timezone: 'America/New_York',
    supportGoals: ['academic_support', 'career_guidance'],
    learningStyles: ['visual'],
    communicationMethods: ['video', 'text'],
    meetingFrequency: 'weekly',
    mentorTraits: ['patient', 'structured'],
    guidanceStyle: 'step_by_step',
    neurodivergence: 'adhd',
  };

  const mockMentor: Mentor = {
    id: 'mentor-1',
    name: 'Test Mentor',
    bio: 'Experienced mentor',
    expertise: ['academic', 'career'],
    approved: true,
    mentorProfile: {
      fullName: 'Test Mentor',
      locationCity: 'Boston',
      locationState: 'MA',
      timezone: 'America/New_York',
      currentRole: 'Teacher',
      expertiseAreas: ['academic support', 'study skills'],
      menteeAgeRange: ['high_school'],
      focusAreas: ['academic', 'career planning'],
      neurodivergenceExperience: 'experienced',
      communicationMethods: ['video', 'text'],
      availabilitySlots: [],
      mentoringApproach: ['structured_guidance'],
    },
  };

  test('should compute match with correct score', () => {
    const result = computeLocalMatch(mockStudent, mockMentor, true);
    
    expect(result.mentorId).toBe('mentor-1');
    expect(result.score).toBeGreaterThan(0);
    expect(result.isCurrentlyAvailable).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  test('should boost score for available mentors', () => {
    const availableResult = computeLocalMatch(mockStudent, mockMentor, true);
    const unavailableResult = computeLocalMatch(mockStudent, mockMentor, false);
    
    expect(availableResult.score).toBeGreaterThan(unavailableResult.score);
  });

  test('should generate relevant match reasons', () => {
    const result = computeLocalMatch(mockStudent, mockMentor, true);
    
    expect(result.reasons).toContain(
      expect.stringContaining('support goals')
    );
  });

  test('should handle mentor without profile', () => {
    const mentorNoProfile = { ...mockMentor, mentorProfile: undefined };
    const result = computeLocalMatch(mockStudent, mentorNoProfile, false);
    
    expect(result.score).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });

  test('should be deterministic', () => {
    const result1 = computeLocalMatch(mockStudent, mockMentor, true);
    const result2 = computeLocalMatch(mockStudent, mockMentor, true);
    
    expect(result1.score).toBe(result2.score);
    expect(result1.reasons).toEqual(result2.reasons);
  });
});
```

### Unit Tests for Availability Check

Create `__tests__/availabilityCheck.test.ts`:

```typescript
import { checkMentorAvailabilityNext7Days } from '../services/availabilityCheck';

describe('Availability Check', () => {
  test('should return false for mentor without availability', async () => {
    const result = await checkMentorAvailabilityNext7Days('nonexistent-mentor');
    expect(result).toBe(false);
  });

  // Note: Integration tests require Firebase emulator
  // Run with: firebase emulators:start
});
```

---

## Running Tests

### Setup Test Environment
```bash
cd misfits
npm install --save-dev jest @testing-library/react-native
```

### Run Tests
```bash
npm test
```

### Run with Coverage
```bash
npm test -- --coverage
```

---

## Edge Cases Covered

1. ✅ Student with incomplete profile → graceful degradation
2. ✅ Mentor with no availability setup → still matchable, ranked lower
3. ✅ Timezone differences > 3 hours → lower compatibility score
4. ✅ Empty mentor list → friendly empty state
5. ✅ External API failure → falls back to local matching only
6. ✅ Concurrent availability checks → batched in parallel
7. ✅ Same mentor in multiple categories → deduplicated in UI
8. ✅ Mentor disables matching → filtered out by `fetchMentors()`

---

## Security Validation

### Access Control
- ✅ Students only see approved mentors (`role === 'mentor'`)
- ✅ Mentors with `mentorMatchingDisabled: true` hidden
- ✅ Suspended accounts cannot request intros
- ✅ No direct mentor profile access without approval

### Data Privacy
- ✅ Student profile never sent to external API (local matching)
- ✅ Match reasons don't expose sensitive student data
- ✅ Availability slots not exposed in match results
- ✅ Admin notes not visible to students

---

## Performance Benchmarks

Target metrics:
- **Initial load**: < 3 seconds (20 mentors)
- **Availability check**: < 500ms per mentor (parallel)
- **Match computation**: < 100ms for 20 mentors
- **Memory usage**: < 50MB for matching operation

Monitor with:
```typescript
console.time('matching');
const result = await computeLocalMatches(...);
console.timeEnd('matching');
```
