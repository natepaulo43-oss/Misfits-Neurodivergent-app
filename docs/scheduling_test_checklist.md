# Scheduling System Test Checklist

**Version**: MVP Phase 1  
**Last Updated**: January 16, 2025

## Pre-Test Setup

- [ ] Install dependencies: `npm install` or `npx expo install @react-native-community/datetimepicker`
- [ ] Ensure Firebase connection is working
- [ ] Have at least 2 test accounts: 1 mentor (approved), 1 student
- [ ] Clear any existing test data if needed

## Test 1: Mentor Availability Setup (First Time)

**Scenario**: Approved mentor has never set availability

### Steps:
1. [ ] Log in as approved mentor
2. [ ] Navigate to Home screen
3. [ ] **VERIFY**: Yellow banner appears: "📅 Set Your Availability"
4. [ ] **VERIFY**: Banner text explains students need to see availability
5. [ ] Tap "Set Up Availability Now" button
6. [ ] **VERIFY**: Navigates to availability-setup screen
7. [ ] **VERIFY**: Timezone shows device timezone
8. [ ] Select session duration: 30 minutes
9. [ ] Select buffer time: 10 minutes
10. [ ] Select max sessions per day: 3
11. [ ] Tap "+ Add Block" button
12. [ ] **VERIFY**: New block appears with Monday, 09:00-17:00
13. [ ] Tap on day name (Monday ▼)
14. [ ] **VERIFY**: Day picker modal appears
15. [ ] Select "Wednesday"
16. [ ] **VERIFY**: Block updates to Wednesday
17. [ ] Tap on start time (09:00)
18. [ ] **VERIFY**: Time picker appears
19. [ ] Select 10:00 AM
20. [ ] Tap "Done" (iOS) or confirm (Android)
21. [ ] **VERIFY**: Start time updates to 10:00
22. [ ] Tap on end time (17:00)
23. [ ] Select 4:00 PM (16:00)
24. [ ] **VERIFY**: End time updates to 16:00
25. [ ] Tap "Save Availability"
26. [ ] **VERIFY**: Success alert appears
27. [ ] **VERIFY**: Returns to previous screen

**Expected Result**: ✅ Mentor can set availability with custom times

## Test 2: Mentor Home Screen - Availability Status

**Scenario**: Mentor with availability set views home screen

### Steps:
1. [ ] Log in as mentor with availability
2. [ ] Navigate to Home screen
3. [ ] **VERIFY**: Green card appears: "✓ Availability Set"
4. [ ] **VERIFY**: Shows "X time blocks configured"
5. [ ] **VERIFY**: "Edit Availability" button present
6. [ ] Tap "Edit Availability"
7. [ ] **VERIFY**: Navigates to availability-setup screen
8. [ ] **VERIFY**: Existing blocks are loaded

**Expected Result**: ✅ Mentor sees availability status and can edit

## Test 3: Edit Existing Availability Block

**Scenario**: Mentor modifies existing availability

### Steps:
1. [ ] Navigate to availability-setup screen (as mentor with blocks)
2. [ ] **VERIFY**: Existing blocks display correctly
3. [ ] Tap on a block's day name
4. [ ] Change to different day
5. [ ] **VERIFY**: Day updates immediately
6. [ ] Tap on start time
7. [ ] Change to different time
8. [ ] **VERIFY**: Time updates immediately (blue highlight)
9. [ ] Tap "Copy to other days"
10. [ ] **VERIFY**: Block copied to all other days (if not already present)
11. [ ] Tap "Remove" on one block
12. [ ] **VERIFY**: Block removed from list
13. [ ] Tap "Save Availability"
14. [ ] **VERIFY**: Changes saved successfully

**Expected Result**: ✅ Mentor can edit, copy, and remove blocks

## Test 4: Student Views Mentor Profile - With Availability

**Scenario**: Student views mentor who has availability set

### Steps:
1. [ ] Log in as student
2. [ ] Navigate to Browse Mentors
3. [ ] Select a mentor with availability
4. [ ] **VERIFY**: "Book Session" button appears (not disabled)
5. [ ] **VERIFY**: Green text shows: "✓ Available for X, Y min sessions"
6. [ ] **VERIFY**: "Message Mentor" button appears as secondary

**Expected Result**: ✅ Student sees booking option for available mentors

## Test 5: Student Views Mentor Profile - Without Availability

**Scenario**: Student views mentor who hasn't set availability

### Steps:
1. [ ] Log in as student
2. [ ] Navigate to mentor profile (mentor without availability)
3. [ ] **VERIFY**: "Book Session (Unavailable)" button appears (disabled)
4. [ ] **VERIFY**: Gray text shows: "This mentor hasn't set availability yet"
5. [ ] Tap disabled button
6. [ ] **VERIFY**: Alert explains mentor hasn't set availability

**Expected Result**: ✅ Student sees clear unavailable state

## Test 6: Student Books Session - Valid Slot

**Scenario**: Student successfully books a session

### Steps:
1. [ ] Log in as student
2. [ ] Navigate to mentor profile (with availability)
3. [ ] Tap "Book Session"
4. [ ] **VERIFY**: Navigates to book-session screen
5. [ ] **VERIFY**: Shows next 14 days as date cards
6. [ ] Select a date within mentor's availability
7. [ ] **VERIFY**: Available time slots appear
8. [ ] **VERIFY**: Slots match mentor's availability blocks
9. [ ] Select session duration (30 min)
10. [ ] **VERIFY**: Slots refresh for new duration
11. [ ] Select a time slot
12. [ ] **VERIFY**: Slot highlights in blue
13. [ ] **VERIFY**: Connection preference section appears
14. [ ] Select "In-app Chat"
15. [ ] Enter notes: "Need help with math homework"
16. [ ] **VERIFY**: Session summary shows correct date/time/duration
17. [ ] Tap "Send Request"
18. [ ] **VERIFY**: Success alert appears
19. [ ] **VERIFY**: Returns to previous screen

**Expected Result**: ✅ Student can book session during available times

## Test 7: Student Books Session - No Available Slots

**Scenario**: Student tries to book when no slots available

### Steps:
1. [ ] Log in as student
2. [ ] Navigate to book-session for mentor
3. [ ] Select a date outside mentor's availability (e.g., day with no blocks)
4. [ ] **VERIFY**: "No available times" message appears
5. [ ] **VERIFY**: Subtext suggests trying different date/duration

**Expected Result**: ✅ Clear empty state when no slots available

## Test 8: Double Booking Prevention

**Scenario**: Two students try to book same slot

### Steps:
1. [ ] Student A books a slot (e.g., Wednesday 10:00 AM)
2. [ ] **VERIFY**: Request created with status = pending
3. [ ] Log in as Student B
4. [ ] Navigate to same mentor's booking screen
5. [ ] Select same date (Wednesday)
6. [ ] **VERIFY**: 10:00 AM slot does NOT appear
7. [ ] **VERIFY**: Other slots still available

**Expected Result**: ✅ Pending requests reserve slots

## Test 9: Buffer Time Enforcement

**Scenario**: Buffer time prevents back-to-back bookings

### Steps:
1. [ ] Mentor has 10-minute buffer set
2. [ ] Student books 10:00-10:30 slot
3. [ ] Check available slots for same date
4. [ ] **VERIFY**: 10:30-11:00 slot is NOT available (buffer)
5. [ ] **VERIFY**: 10:40-11:10 slot IS available (after buffer)

**Expected Result**: ✅ Buffer time creates gap between sessions

## Test 10: Max Sessions Per Day Enforcement

**Scenario**: Daily session limit prevents overbooking

### Steps:
1. [ ] Mentor has max 3 sessions per day
2. [ ] Create 3 pending/confirmed sessions for a date
3. [ ] Student tries to book 4th session on same date
4. [ ] **VERIFY**: No slots available for that date
5. [ ] **VERIFY**: Other dates still show slots

**Expected Result**: ✅ Max sessions per day enforced

## Test 11: Mentor Accepts Session Request

**Scenario**: Mentor accepts pending request

### Steps:
1. [ ] Log in as mentor
2. [ ] Navigate to Sessions tab
3. [ ] **VERIFY**: "Pending" filter shows badge with count
4. [ ] Tap "Pending" filter
5. [ ] **VERIFY**: Pending session appears
6. [ ] Tap on session card
7. [ ] **VERIFY**: Session detail shows all info (date, time, student notes)
8. [ ] Tap "Accept Session"
9. [ ] Confirm in alert
10. [ ] **VERIFY**: Status changes to "Confirmed"
11. [ ] **VERIFY**: Session moves to "Upcoming" filter
12. [ ] Log in as student
13. [ ] Navigate to Sessions tab
14. [ ] **VERIFY**: Session shows as "Confirmed" in Upcoming

**Expected Result**: ✅ Mentor can accept and student sees update

## Test 12: Mentor Declines Session Request

**Scenario**: Mentor declines with reason

### Steps:
1. [ ] Log in as mentor
2. [ ] Navigate to pending session
3. [ ] Tap "Decline"
4. [ ] **VERIFY**: Modal appears with reason options
5. [ ] Select "Schedule conflict"
6. [ ] Tap "Decline" in modal
7. [ ] **VERIFY**: Status changes to "Declined"
8. [ ] **VERIFY**: Session moves to "Past" filter
9. [ ] Log in as student
10. [ ] Navigate to Sessions → Past
11. [ ] **VERIFY**: Session shows as "Declined"
12. [ ] **VERIFY**: Decline reason visible

**Expected Result**: ✅ Mentor can decline with reason

## Test 13: Mentor Proposes Reschedule

**Scenario**: Mentor suggests alternative times

### Steps:
1. [ ] Log in as mentor
2. [ ] Navigate to pending session
3. [ ] Tap "Suggest New Time"
4. [ ] **VERIFY**: Can select alternative slots
5. [ ] Select 2-3 alternative times
6. [ ] Confirm reschedule proposal
7. [ ] **VERIFY**: Status changes to "Reschedule Proposed"
8. [ ] Log in as student
9. [ ] Navigate to Sessions → Pending
10. [ ] **VERIFY**: Session shows "Reschedule Proposed"
11. [ ] **VERIFY**: Banner says "Mentor proposed new times"
12. [ ] Tap on session
13. [ ] **VERIFY**: Alternative times displayed
14. [ ] Tap on one alternative time
15. [ ] Confirm acceptance
16. [ ] **VERIFY**: Status changes to "Confirmed"
17. [ ] **VERIFY**: New time is now the session time

**Expected Result**: ✅ Reschedule flow works end-to-end

## Test 14: Session Cancellation

**Scenario**: Either party cancels session

### Steps:
1. [ ] Create confirmed session
2. [ ] Log in as student (or mentor)
3. [ ] Navigate to session detail
4. [ ] Tap "Cancel Session"
5. [ ] Confirm in alert
6. [ ] **VERIFY**: Status changes to "Cancelled"
7. [ ] **VERIFY**: Session moves to "Past" filter
8. [ ] Log in as other party
9. [ ] **VERIFY**: Session shows as "Cancelled"

**Expected Result**: ✅ Both parties can cancel

## Test 15: Mentor Marks Session Complete

**Scenario**: Mentor marks session as done

### Steps:
1. [ ] Create confirmed session (past time preferred)
2. [ ] Log in as mentor
3. [ ] Navigate to session detail
4. [ ] Tap "Mark as Complete"
5. [ ] **VERIFY**: Status changes to "Completed"
6. [ ] **VERIFY**: "Add Private Note" button appears
7. [ ] Tap "Add Private Note"
8. [ ] Enter session notes
9. [ ] Enter follow-up tasks
10. [ ] Save note
11. [ ] **VERIFY**: Note appears in session detail
12. [ ] Log in as student
13. [ ] Navigate to same session
14. [ ] **VERIFY**: Status shows "Completed"
15. [ ] **VERIFY**: Private notes NOT visible to student

**Expected Result**: ✅ Mentor can complete and add private notes

## Test 16: Chat Thread Creation

**Scenario**: Session request creates chat thread

### Steps:
1. [ ] Student creates session request
2. [ ] **VERIFY**: Session has chatId field populated
3. [ ] Tap "Open Chat" in session detail
4. [ ] **VERIFY**: Navigates to existing chat thread
5. [ ] **VERIFY**: Thread shows both participants

**Expected Result**: ✅ Chat automatically linked to session

## Test 17: Real-Time Availability Updates

**Scenario**: Student sees updated slots when mentor edits

### Steps:
1. [ ] Student opens book-session screen for mentor
2. [ ] Note available slots for Wednesday
3. [ ] (Keep screen open or in background)
4. [ ] Mentor edits availability, removes Wednesday block
5. [ ] Mentor saves changes
6. [ ] Student returns to book-session screen (focus)
7. [ ] **VERIFY**: Wednesday slots refresh/disappear
8. [ ] Mentor adds new block for Thursday
9. [ ] Student navigates to Thursday
10. [ ] **VERIFY**: New slots appear

**Expected Result**: ✅ Slots refresh on screen focus

## Test 18: Timezone Handling

**Scenario**: Slots display correctly in local time

### Steps:
1. [ ] Mentor sets availability in their timezone (e.g., ET)
2. [ ] Mentor adds block: Wednesday 2:00 PM - 5:00 PM
3. [ ] Student in different timezone (e.g., PT) books session
4. [ ] **VERIFY**: Student sees slots in their local time (11:00 AM - 2:00 PM PT)
5. [ ] Student books 11:00 AM PT slot
6. [ ] **VERIFY**: Session stored with UTC timestamps
7. [ ] Mentor views session
8. [ ] **VERIFY**: Mentor sees 2:00 PM ET (their local time)

**Expected Result**: ✅ Timezone conversions work correctly

## Test 19: Firestore Security Rules

**Scenario**: Unauthorized access is blocked

### Steps:
1. [ ] Try to read another mentor's availability (should work - public)
2. [ ] Try to update another mentor's availability (should fail)
3. [ ] Try to read another student's session (should fail)
4. [ ] Try to update session as non-participant (should fail)
5. [ ] Try to read mentor's private notes as student (should fail)
6. [ ] Admin reads all data (should work)

**Expected Result**: ✅ Rules enforce proper access control

## Test 20: Edge Cases

### Empty Availability
- [ ] Mentor saves availability with 0 blocks (should fail validation)

### Invalid Time Ranges
- [ ] Mentor sets end time before start time (should fail validation)

### Past Dates
- [ ] Student tries to book session in the past (should not show slots)

### Suspended Account
- [ ] Suspended student tries to book session (should fail)
- [ ] Suspended mentor tries to update availability (should fail)

### Concurrent Bookings
- [ ] Two students submit requests for same slot simultaneously (one should fail)

**Expected Result**: ✅ Edge cases handled gracefully

## Performance Checks

- [ ] Availability setup screen loads in < 2 seconds
- [ ] Slot generation for 14 days completes in < 3 seconds
- [ ] Session list loads in < 2 seconds
- [ ] No memory leaks when navigating between screens
- [ ] Smooth scrolling in all lists

## Accessibility Checks

- [ ] All buttons have clear labels
- [ ] Time pickers work on both iOS and Android
- [ ] Modals can be dismissed
- [ ] Error messages are clear and actionable
- [ ] Success states are obvious

## Summary

**Total Tests**: 20 test scenarios  
**Critical Tests**: Tests 1-8, 11-12, 17-18  
**Estimated Time**: 2-3 hours for full suite

## Known Issues / Limitations

1. **DateTimePicker Package**: Requires `npm install @react-native-community/datetimepicker@7.6.1`
2. **Timezone**: Currently uses device timezone (no manual selector)
3. **Real-time**: Uses focus refresh, not live Firestore listeners
4. **Notifications**: Stubbed in Cloud Functions (not implemented)

## Next Steps After Testing

- [ ] Fix any bugs discovered
- [ ] Add unit tests for slot generation
- [ ] Implement FCM push notifications
- [ ] Add timezone selector to availability setup
- [ ] Add availability preview for mentors
- [ ] Consider Firestore listeners for true real-time updates
