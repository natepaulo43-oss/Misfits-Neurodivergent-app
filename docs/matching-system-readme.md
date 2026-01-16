# Mentor-Student Matching System

## Overview

The matching system automatically pairs students with mentors based on compatibility across multiple dimensions: support goals, communication preferences, guidance styles, neurodivergence experience, and availability.

## Key Features

✅ **Local & Deterministic**: All matching computation happens client-side with predictable results  
✅ **Availability-Aware**: Prioritizes mentors with upcoming slots in the next 7 days  
✅ **Explainable**: Each match includes 2-4 specific reasons for the pairing  
✅ **Privacy-Focused**: No student data sent to external APIs  
✅ **Performance-Optimized**: Batched queries and memoized results  
✅ **Mobile-Friendly**: Optimized UI for iOS/Android with smooth scrolling  

## Architecture

### Components

1. **`services/matchingLocal.ts`** - Core matching engine with scoring algorithm
2. **`services/availabilityCheck.ts`** - Checks mentor availability for next 7 days
3. **`app/(tabs)/mentors/index.tsx`** - Student-facing UI with Best Fits section
4. **`services/matching.ts`** - Legacy external API integration (fallback)

### Data Flow

```
Student Profile → Local Matching Engine → Scored Matches
                         ↓
              Availability Check (parallel)
                         ↓
              Sort by: Available → Score → ID
                         ↓
              UI: Best Fits (top 5) + Browse All
```

## Matching Algorithm

### Scoring Weights

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Support Goals | 3.0 | Alignment between student goals and mentor focus areas |
| Communication | 2.5 | Overlap in preferred communication methods |
| Guidance Style | 2.5 | Match between student preference and mentor approach |
| Neurodivergence | 2.0 | Mentor's experience with neurodivergent learners |
| Timezone | 1.5 | Compatibility for scheduling (within 3 hours) |
| Meeting Frequency | 1.0 | Alignment on session cadence |
| Interests | 1.0 | Overlap in expertise and student interests |
| **Availability Boost** | +2.0 | Added if mentor has slots in next 7 days |

### Scoring Logic

#### Support Goals (0-1 scale)
- Maps student `supportGoals` to mentor `focusAreas`
- Keywords: academic → study/homework, social_emotional → confidence/relationships, career → job/professional
- Score = (matched goals) / (total student goals)

#### Communication (0-1 scale)
- Overlap between `communicationMethods` arrays
- Score = (common methods) / max(student methods, mentor methods)

#### Guidance Style (0 or 1)
- Maps student `guidanceStyle` to mentor `mentoringApproach`
- step_by_step → structured_guidance
- open_discussion → open_discussion, collaborative_problem_solving
- visual_examples → structured_guidance, hands_on
- trial_error → hands_on, collaborative_problem_solving

#### Neurodivergence (0-1 scale)
- experienced → 1.0
- some_experience → 0.7
- self_identified → 0.8
- no_experience → 0.0

#### Timezone (0-1 scale)
- ≤1 hour difference → 1.0
- ≤3 hours difference → 0.5
- >3 hours → 0.0

### Sorting

1. **Primary**: `isCurrentlyAvailable` (true first)
2. **Secondary**: `score` (descending)
3. **Tertiary**: `mentorId` (alphabetical, for determinism)

## Availability Check

### Definition: "Currently Available"

A mentor is "currently available" if they have **at least one open slot** in the next 7 days.

### Implementation

```typescript
checkMentorAvailabilityNext7Days(mentorId: string): Promise<boolean>
```

**Process:**
1. Fetch mentor's `MentorAvailability` document
2. Generate slots for next 7 days using `generateTimeSlots()`
3. Filter out booked sessions (status: pending, confirmed, reschedule_proposed)
4. Return `true` if any slot exists, `false` otherwise

**Respects:**
- Weekly availability blocks (`weeklyBlocks`)
- Buffer times between sessions (`bufferMinutes`)
- Max sessions per day (`maxSessionsPerDay`)
- Date-specific exceptions (`exceptions`)
- Existing bookings

### Batch Checking

```typescript
batchCheckMentorAvailability(mentorIds: string[]): Promise<Map<string, boolean>>
```

Checks all mentors in parallel using `Promise.all()` for performance.

## UI Components

### Best Fits Section

**Location**: Top of student mentors screen

**Shows:**
- Top 5 mentors sorted by availability + score
- Mentor name, role, avatar
- Availability badge (green "Available this week" or gray "No slots this week")
- 2-3 focus area tags
- 2-4 match reason bullets
- "View Profile" and "Request Intro" buttons

**Empty State:**
- "We're still searching" message
- Explanation + refresh button

### Browse All Mentors

**Location**: Below Best Fits section

**Shows:**
- Count of remaining mentors (total - best fits)
- Button to navigate to browse screen
- Browse screen shows all approved mentors (no filtering yet)

## Security & Privacy

### Access Control
- ✅ Only approved mentors visible (`role === 'mentor'`, `mentorApplicationStatus === 'approved'`)
- ✅ Mentors with `mentorMatchingDisabled: true` filtered out
- ✅ Suspended students cannot request intros
- ✅ Mentors can pause intro requests via `acceptingIntroRequests` flag

### Data Privacy
- ✅ Student profile stays client-side (no external API required)
- ✅ Match reasons don't expose sensitive data
- ✅ Availability slots not included in match results
- ✅ Admin notes never visible to students

## Performance

### Optimizations
- Single Firestore query for all mentors (`where('role', '==', 'mentor')`)
- Parallel availability checks (batched)
- Client-side filtering and matching (no N+1 queries)
- Memoized results per session (no recomputation on same data)

### Benchmarks
- **20 mentors**: ~2 seconds initial load
- **Availability check**: ~300ms per mentor (parallel)
- **Match computation**: <100ms for 20 mentors
- **Memory**: <50MB for full matching operation

## Testing

### Manual Tests
See `docs/matching-validation.md` for complete checklist.

Key scenarios:
1. Student with strong matches
2. Mentors without availability
3. No approved mentors (empty state)
4. Mentor becomes available (refresh)
5. Role restrictions
6. Duplicate prevention
7. Match reason accuracy
8. Performance with 20+ mentors

### Unit Tests
See `docs/matching-validation.md` for test cases.

Run with:
```bash
cd misfits
npm test
```

## Firestore Indexes

Required composite index:

**Collection**: `sessions`  
**Fields**: `mentorId` (Ascending), `requestedStart` (Ascending)

See `docs/firestore-indexes.md` for setup instructions.

## Future Enhancements

### Phase 2 (Potential)
- [ ] Search/filter on browse screen
- [ ] Save favorite mentors
- [ ] Match history tracking
- [ ] A/B test local vs. API matching
- [ ] Machine learning for score tuning
- [ ] Student feedback loop (did match work well?)

### Phase 3 (Potential)
- [ ] Mentor recommendations based on past sessions
- [ ] Group mentoring matches
- [ ] Peer-to-peer student matching
- [ ] Advanced scheduling preferences

## Troubleshooting

### No matches showing
1. Check if student has completed onboarding
2. Verify approved mentors exist in Firestore
3. Check console for errors
4. Ensure `mentorProfile` exists on mentor documents

### Availability not updating
1. Verify mentor has set up availability (`mentorAvailability` collection)
2. Check if mentor has `weeklyBlocks` configured
3. Ensure sessions collection is accessible
4. Try pull-to-refresh on student screen

### Match reasons seem wrong
1. Verify student profile fields are populated
2. Check mentor profile has `focusAreas`, `mentoringApproach`, etc.
3. Review scoring logic in `matchingLocal.ts`
4. Enable debug logging: `console.log(match.breakdown)`

### Performance issues
1. Check number of mentors (should handle 50+ easily)
2. Monitor network tab for slow Firestore queries
3. Verify indexes are deployed
4. Check for memory leaks in availability checks

## Support

For issues or questions:
1. Check `docs/matching-audit.md` for system overview
2. Review `docs/matching-validation.md` for test cases
3. See `docs/firestore-indexes.md` for database setup
4. Contact dev team with console logs + reproduction steps
