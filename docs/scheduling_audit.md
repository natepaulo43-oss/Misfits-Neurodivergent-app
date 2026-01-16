# Scheduling System Audit

**Date**: January 16, 2025  
**Status**: Phase 1 Implementation Review

## Executive Summary

The scheduling system has a **solid foundation** but requires **critical fixes** to meet MVP requirements. Key gaps:
1. ❌ Availability blocks cannot be edited (only added/removed)
2. ❌ No time picker UI for editing start/end times
3. ❌ Mentor Home screen lacks availability setup prompt
4. ❌ Mentor profile detail screen missing "Book Session" button
5. ⚠️ No real-time listeners for availability changes

## Data Model

### Collections & Field Names

#### `mentorAvailability/{mentorId}`
- ✅ **Single source of truth** for mentor availability
- Fields:
  - `mentorId`: string
  - `timezone`: string (e.g., "America/New_York")
  - `sessionDurations`: number[] (e.g., [30, 45, 60])
  - `bufferMinutes`: number
  - `maxSessionsPerDay`: number | undefined
  - `weeklyBlocks`: WeeklyAvailabilityBlock[]
    - `dayOfWeek`: number (0-6)
    - `startTime`: string ("HH:MM" in local time)
    - `endTime`: string ("HH:MM" in local time)
  - `exceptions`: AvailabilityException[]
  - `updatedAt`: string (ISO timestamp)

#### `sessions/{sessionId}`
- ✅ **Canonical session storage**
- Fields:
  - `studentId`: string
  - `mentorId`: string
  - `status`: "pending" | "confirmed" | "declined" | "reschedule_proposed" | "cancelled" | "completed"
  - `requestedStart`: string (UTC ISO timestamp)
  - `requestedEnd`: string (UTC ISO timestamp)
  - `confirmedStart`: string | undefined (UTC ISO timestamp)
  - `confirmedEnd`: string | undefined (UTC ISO timestamp)
  - `studentTimezone`: string
  - `mentorTimezone`: string
  - `connectionPreference`: "chat" | "phone" | "video" | "other"
  - `studentNotes`: string | undefined
  - `mentorResponseReason`: string | undefined
  - `rescheduleOptions`: RescheduleOption[] | undefined
  - `chatId`: string | undefined
  - `createdAt`: string (ISO timestamp)
  - `updatedAt`: string (ISO timestamp)
  - `reminderState`: object

#### `sessionNotes/{noteId}`
- ✅ Mentor-private notes
- Fields:
  - `sessionId`: string
  - `mentorId`: string
  - `note`: string
  - `followUps`: string | undefined
  - `createdAt`: string
  - `updatedAt`: string | undefined

## Screen Routes & Files

### Mentor Screens
- **Availability Setup/Edit**: `/(tabs)/availability-setup.tsx`
  - Route: `/(tabs)/availability-setup`
  - Accessible from Sessions tab → "Availability" button
  - ❌ **CRITICAL**: No time picker UI - times are hardcoded to 09:00-17:00
  - ❌ **CRITICAL**: Cannot edit existing blocks, only remove and re-add
  
- **Home Screen**: `/(tabs)/home.tsx`
  - Route: `/(tabs)/home`
  - ❌ **MISSING**: No availability setup prompt for approved mentors without availability
  
- **Sessions Inbox**: `/(tabs)/sessions.tsx`
  - Route: `/(tabs)/sessions`
  - ✅ Has "Availability" button in header for mentors
  - ✅ Shows pending/upcoming/past filters
  
- **Session Detail**: `/(tabs)/session-detail.tsx`
  - Route: `/(tabs)/session-detail`
  - ✅ Accept/decline/reschedule actions working
  - ✅ Private notes functionality

### Student Screens
- **Mentor Profile**: `/(tabs)/mentors/[id].tsx`
  - Route: `/(tabs)/mentors/[id]`
  - ❌ **MISSING**: No "Book Session" button
  - Only has "Message Mentor" button
  
- **Book Session**: `/(tabs)/book-session.tsx`
  - Route: `/(tabs)/book-session`
  - ✅ Date selection, duration picker, slot display
  - ✅ Connection preference and notes
  - ⚠️ No direct navigation path from mentor profile
  
- **Sessions List**: `/(tabs)/sessions.tsx`
  - Route: `/(tabs)/sessions`
  - ✅ Shows pending/upcoming/past sessions
  - ✅ Status badges and action prompts

## Slot Generation Logic

### Location
- **Utility**: `misfits/utils/scheduling.ts`
  - `generateTimeSlots()` function
  - ✅ Converts local time to UTC
  - ✅ Applies exceptions (blocked dates, overrides)
  - ✅ Filters existing sessions (pending/confirmed/reschedule_proposed)
  - ✅ Applies buffer time
  - ✅ Enforces max sessions per day
  - ✅ Returns only available slots

### Service Layer
- **Service**: `misfits/services/scheduling.ts`
  - `getAvailableSlots()` - fetches availability + sessions, calls generateTimeSlots
  - `createSessionRequest()` - creates session with UTC timestamps
  - ✅ Timezone handling correct
  - ✅ Double-booking prevention via status filtering

## Firestore Security Rules

### Location
- **File**: `firestore.rules`

### Mentor Availability Rules (Lines 166-181)
- ✅ Any authenticated user can read (for booking)
- ✅ Mentors can create/update their own availability
- ✅ Only mentors with role='mentor' can write
- ✅ Account must be active (not suspended)
- ✅ Admins have full access
- ✅ Deletion blocked (preserve data)

### Sessions Rules (Lines 187-224)
- ✅ Students and mentors can read their own sessions
- ✅ Students can create where studentId == auth.uid
- ✅ Students can only update to cancel or accept reschedule
- ✅ Mentors can update their sessions (accept/decline/reschedule/complete/cancel)
- ✅ Account must be active
- ✅ Admins have full access

### Session Notes Rules (Lines 230-254)
- ✅ Only mentor who created note can read it
- ✅ Mentors can create/update their own notes
- ✅ Admins can read all notes (oversight)
- ✅ Deletion blocked (audit trail)

**Security Assessment**: ✅ Rules are solid and enforce proper access control

## Current Gaps & Bugs

### CRITICAL (Blocks MVP)
1. **No Time Picker UI** - Availability blocks hardcoded to 09:00-17:00
   - Location: `availability-setup.tsx` lines 76-82
   - Impact: Mentors cannot set actual availability times
   
2. **Cannot Edit Blocks** - Only add/remove, no edit functionality
   - Location: `availability-setup.tsx`
   - Impact: Mentors must delete and recreate to change times
   
3. **Missing Availability Prompt** - Mentor Home screen doesn't check/prompt
   - Location: `home.tsx`
   - Impact: Approved mentors may not know to set availability
   
4. **Missing Book Button** - Mentor profile has no booking CTA
   - Location: `mentors/[id].tsx`
   - Impact: Students cannot easily book sessions

### MEDIUM (UX Issues)
5. **No Real-Time Updates** - Availability changes require app restart
   - Impact: Student booking slots don't refresh when mentor edits
   - Solution: Add Firestore listeners or screen focus refresh

6. **No Availability Status Badge** - Can't tell if mentor has availability set
   - Location: Mentor profile, mentor list screens
   - Impact: Students may try to book with unavailable mentors

### MINOR (Nice to Have)
7. **No Timezone Selector** - Uses device timezone only
   - Location: `availability-setup.tsx` line 45
   - Impact: Mentors traveling can't adjust timezone

8. **No Availability Preview** - Can't see how availability looks to students
   - Impact: Mentors unsure if setup is correct

## Data Flow Consistency

### Availability Update Flow
1. ✅ Mentor edits availability → `saveMentorAvailability()` → Firestore `mentorAvailability/{mentorId}`
2. ⚠️ Student views slots → `getAvailableSlots()` → reads from Firestore (but no listener)
3. ❌ **GAP**: No automatic refresh when availability changes

### Session Request Flow
1. ✅ Student selects slot → `createSessionRequest()` → Firestore `sessions/{id}` with status='pending'
2. ✅ Mentor views request → `getSessionsForUser()` → reads sessions
3. ✅ Mentor accepts → `acceptSessionRequest()` → updates status='confirmed'
4. ✅ Student sees update → manual refresh or screen focus

### Timezone Handling
- ✅ Mentor availability stored in local time (HH:MM format)
- ✅ Slot generation converts to UTC for selected date
- ✅ Session timestamps stored in UTC
- ✅ Display uses local device time
- ⚠️ **ISSUE**: `convertLocalTimeToUTC()` doesn't actually use timezone parameter (lines 25-36 in scheduling.ts)

## Testing Status

### Manual Testing Checklist (from SCHEDULING_SYSTEM.md)
- [ ] Mentor can set and edit availability
- [ ] Student sees only valid time slots
- [ ] Double-booking is prevented
- [ ] Mentor can accept session request
- [ ] Mentor can decline with reason
- [ ] Mentor can propose reschedule
- [ ] Student can accept proposed reschedule
- [ ] Both parties can cancel session
- [ ] Mentor can mark session complete
- [ ] Mentor can add private notes
- [ ] Session history displays correctly
- [ ] Chat thread is created/linked automatically
- [ ] Timezone conversions work correctly
- [ ] Buffer time prevents overlapping sessions
- [ ] Max sessions per day is enforced
- [ ] Firestore rules prevent unauthorized access

### Automated Tests
- ❌ No unit tests exist for slot generation
- ❌ No integration tests for booking flow

## Required Fixes for MVP

### Priority 1 (Must Fix)
1. Add time picker UI to availability-setup.tsx
2. Add edit functionality for existing blocks
3. Add availability check + prompt to mentor home.tsx
4. Add "Book Session" button to mentor profile (mentors/[id].tsx)

### Priority 2 (Should Fix)
5. Add Firestore listener or focus refresh for availability changes
6. Fix timezone conversion to actually use timezone parameter
7. Add availability status indicator on mentor profiles

### Priority 3 (Nice to Have)
8. Add timezone selector to availability setup
9. Add availability preview for mentors
10. Add unit tests for slot generation

## Recommendations

1. **Immediate**: Implement time picker using React Native DateTimePicker or custom time selector
2. **Immediate**: Add edit mode to availability blocks with inline time editing
3. **Immediate**: Add availability check service function and integrate into home screen
4. **Short-term**: Add `onSnapshot` listeners for real-time updates
5. **Short-term**: Create slot generation unit tests
6. **Long-term**: Consider caching availability data for performance

## Conclusion

The scheduling system architecture is **well-designed** with proper data modeling, security rules, and slot generation logic. However, the **UI implementation is incomplete** and blocks core MVP functionality. The fixes are straightforward and can be implemented without architectural changes.

**Estimated Effort**: 4-6 hours to reach MVP-ready state
