# Scheduling System (Phase 1)

## Overview

The Misfits app now includes a complete Scheduling & Session Management system that allows students to request sessions with mentors, mentors to manage their availability and session requests, and both parties to track session history.

**Phase 1 Scope**: This implementation focuses on booking session times and storing connection preferences. Video calling integration is planned for a future phase. For now, mentors can share meeting links via the integrated chat system.

## Key Features

### For Mentors
- **Availability Management**: Set recurring weekly availability blocks with timezone support
- **Session Duration Options**: Offer 30, 45, or 60-minute sessions
- **Buffer Time**: Automatic buffer between sessions (5-30 minutes)
- **Max Sessions Per Day**: Limit daily session load
- **Date Exceptions**: Block specific dates or override availability
- **Session Inbox**: View and manage pending requests
- **Accept/Decline/Reschedule**: Flexible response options
- **Private Notes**: Add session notes and follow-up tasks (mentor-only)
- **Session History**: Track all past and upcoming sessions

### For Students
- **Browse Mentor Availability**: View available time slots in real-time
- **Book Sessions**: Select date, time, and connection preference
- **Session Requests**: Add optional notes about what help is needed
- **Track Status**: Monitor pending, upcoming, and past sessions
- **Accept Reschedules**: Review and accept mentor-proposed alternative times
- **Integrated Chat**: Automatic chat thread creation with mentor

### For Admins
- **Full Visibility**: Read all sessions, availability, and notes
- **Override Capabilities**: Manage sessions on behalf of users
- **Moderation**: Access to mentor private notes for oversight

## Data Model

### Collections

#### `mentorAvailability/{mentorId}`
```typescript
{
  mentorId: string;
  timezone: string;                    // e.g., "America/New_York"
  sessionDurations: number[];          // e.g., [30, 45, 60]
  bufferMinutes: number;               // e.g., 10
  maxSessionsPerDay?: number;          // e.g., 3
  weeklyBlocks: [
    {
      dayOfWeek: number;               // 0-6 (Sunday-Saturday)
      startTime: string;               // "HH:MM" in mentor's local time
      endTime: string;                 // "HH:MM" in mentor's local time
    }
  ];
  exceptions: [
    {
      date: string;                    // "YYYY-MM-DD"
      type: "blocked" | "override";
      blocks?: WeeklyAvailabilityBlock[];
    }
  ];
  updatedAt: string;                   // ISO timestamp
}
```

#### `sessions/{sessionId}`
```typescript
{
  studentId: string;
  mentorId: string;
  status: "pending" | "confirmed" | "declined" | "reschedule_proposed" | "cancelled" | "completed";
  requestedStart: string;              // UTC ISO timestamp
  requestedEnd: string;                // UTC ISO timestamp
  confirmedStart?: string;             // UTC ISO timestamp
  confirmedEnd?: string;               // UTC ISO timestamp
  studentTimezone: string;
  mentorTimezone: string;
  connectionPreference: "chat" | "phone" | "video" | "other";
  studentNotes?: string;
  mentorResponseReason?: string;
  rescheduleOptions?: [
    {
      start: string;                   // UTC ISO timestamp
      end: string;                     // UTC ISO timestamp
    }
  ];
  chatId?: string;                     // Link to threads collection
  createdAt: string;
  updatedAt: string;
  reminderState?: {
    sent24h: boolean;
    sent1h: boolean;
    scheduled24h?: string;
    scheduled1h?: string;
  };
}
```

#### `sessionNotes/{noteId}`
```typescript
{
  sessionId: string;
  mentorId: string;
  note: string;
  followUps?: string;
  createdAt: string;
  updatedAt?: string;
}
```

## Slot Generation Algorithm

The system uses a deterministic slot generation algorithm that:

1. **Converts Times to UTC**: Mentor's local availability blocks are converted to UTC for the selected date
2. **Applies Exceptions**: Checks for blocked dates or override availability
3. **Filters Existing Sessions**: Excludes slots that overlap with pending/confirmed sessions
4. **Applies Buffer Time**: Ensures minimum gap between sessions
5. **Enforces Daily Limits**: Respects max sessions per day setting
6. **Returns Available Slots**: Only shows truly available time slots to students

### Conflict Prevention
- Pending requests reserve slots (prevents double-booking)
- Buffer time prevents back-to-back sessions
- Timezone conversions ensure accurate scheduling across time zones

## User Flows

### Mentor: Set Up Availability (Required After Approval)

1. Navigate to Sessions tab → "Availability" button
2. Confirm timezone (auto-detected)
3. Select session duration options (30/45/60 min)
4. Set buffer time between sessions (5/10/15/30 min)
5. Set max sessions per day (1-5)
6. Add weekly availability blocks:
   - Select day of week
   - Set start and end times
   - Optionally copy to other days
7. Save availability

### Student: Book a Session

1. Navigate to mentor profile
2. Tap "Book Session" button
3. Select date from calendar (next 14 days)
4. Choose session duration
5. View and select available time slot
6. Select connection preference (chat/phone/video/other)
7. Add optional notes about what help is needed
8. Review summary and send request
9. Automatic chat thread created with mentor

### Mentor: Manage Session Requests

1. Navigate to Sessions tab → "Pending" filter
2. Tap on session request to view details
3. Choose action:
   - **Accept**: Confirms the session
   - **Decline**: Select reason and notify student
   - **Suggest New Time**: Propose up to 3 alternative slots
4. Student receives notification of response

### Student: Accept Reschedule

1. Navigate to Sessions tab → "Pending" filter
2. View session with "Reschedule Proposed" status
3. Review mentor's proposed alternative times
4. Tap on preferred time to accept
5. Session confirmed at new time

### Mentor: Add Private Notes

1. After session occurs, navigate to session detail
2. Tap "Add Private Note"
3. Enter session notes
4. Optionally add follow-up tasks
5. Save (visible only to mentor and admin)

## Security Rules

### Mentor Availability
- ✅ Any authenticated user can read (for booking)
- ✅ Mentors can create/update their own availability
- ✅ Admins have full access
- ❌ Cannot be deleted (preserve data)

### Sessions
- ✅ Students and mentors can read their own sessions
- ✅ Students can create requests where they are the student
- ✅ Students can cancel or accept reschedule proposals
- ✅ Mentors can accept, decline, propose reschedule, mark complete, or cancel
- ✅ Admins have full access

### Session Notes
- ✅ Only the mentor who created the note can read it
- ✅ Mentors can create notes for their sessions
- ✅ Admins can read all notes (oversight)
- ❌ Cannot be deleted (audit trail)

## Notifications (Stubbed for Phase 1)

The system includes Cloud Functions with notification hooks that log to console. These are ready for FCM integration:

### Triggers
- **Session Created**: Notify mentor of new request
- **Session Accepted**: Notify student of confirmation
- **Session Declined**: Notify student with reason
- **Reschedule Proposed**: Notify student of alternative times
- **Session Cancelled**: Notify other party
- **Session Completed**: Notify student

### Reminders
- **24-hour reminder**: Scheduled function checks hourly
- **1-hour reminder**: Scheduled function checks hourly
- Reminder state tracked in session document

## File Structure

```
misfits/
├── types/index.ts                           # Extended with scheduling types
├── utils/scheduling.ts                      # Slot generation & timezone utilities
├── services/scheduling.ts                   # Firestore service layer
├── app/(tabs)/
│   ├── availability-setup.tsx              # Mentor availability editor
│   ├── book-session.tsx                    # Student booking flow
│   ├── sessions.tsx                        # Session inbox (both roles)
│   └── session-detail.tsx                  # Session detail & actions
└── functions/src/scheduling.ts             # Cloud Functions (notification stubs)

firestore.rules                              # Updated security rules
```

## Required Firestore Indexes

The following composite indexes are required (Firebase will prompt to create these on first query):

1. **sessions collection**:
   - `mentorId` (Ascending) + `createdAt` (Descending)
   - `studentId` (Ascending) + `createdAt` (Descending)
   - `status` (Ascending) + `confirmedStart` (Ascending)

2. **sessionNotes collection**:
   - `sessionId` (Ascending) + `createdAt` (Descending)

## Integration Points

### Existing Features
- **Messaging**: Automatic chat thread creation when session is requested
- **User Profiles**: Mentor profiles include "Book Session" CTA
- **Auth & Roles**: Full RBAC integration (student/mentor/admin)
- **Account Status**: Respects suspended/disabled accounts

### Future Enhancements (Post-Phase 1)
- **Video Integration**: Replace connection preference with actual video calling
- **Paid Sessions**: Add payment processing before confirmation
- **Recurring Sessions**: Allow students to book repeating sessions
- **Calendar Sync**: Export to Google Calendar, iCal
- **Advanced Reminders**: Email and SMS reminders
- **Session Ratings**: Student feedback after completion
- **Analytics**: Session metrics for mentors and admins

## Testing Checklist

- [ ] Mentor can set and edit availability
- [ ] Student sees only valid time slots
- [ ] Double-booking is prevented (pending reserves slot)
- [ ] Mentor can accept session request
- [ ] Mentor can decline with reason
- [ ] Mentor can propose reschedule with alternative times
- [ ] Student can accept proposed reschedule
- [ ] Both parties can cancel session
- [ ] Mentor can mark session complete
- [ ] Mentor can add private notes (student cannot see)
- [ ] Session history displays correctly
- [ ] Chat thread is created/linked automatically
- [ ] Timezone conversions work correctly
- [ ] Buffer time prevents overlapping sessions
- [ ] Max sessions per day is enforced
- [ ] Firestore rules prevent unauthorized access

## Deployment Notes

1. **Deploy Firestore Rules**: `firebase deploy --only firestore:rules`
2. **Deploy Cloud Functions**: `firebase deploy --only functions`
3. **Create Indexes**: Follow Firebase Console prompts on first query
4. **Test Notifications**: Verify Cloud Function logs for notification stubs
5. **Monitor Usage**: Check Firestore usage for read/write patterns

## Minor Safety Patterns

- All timestamps stored in UTC
- Student notes limited to 500 characters
- Session notes are mentor-private (students cannot access)
- Pending requests reserve time slots (prevents double-booking)
- Account suspension blocks session creation/updates
- Audit trail preserved (no deletion of sessions/notes)
- Admin oversight on all session data

## Support for Future Roles

The data model and security rules are designed to accommodate:
- **Guardian role**: Can view student's sessions (add to security rules)
- **Group sessions**: Extend session model with multiple students
- **Mentor teams**: Multiple mentors per session

## Troubleshooting

### Slots not showing
- Check mentor has set availability
- Verify date is not blocked in exceptions
- Confirm max sessions per day not reached
- Check for existing pending/confirmed sessions

### Timezone issues
- Ensure device timezone is correct
- Verify mentor timezone in availability settings
- Check UTC conversion in slot generation

### Notification not received
- Verify Cloud Functions are deployed
- Check function logs in Firebase Console
- Implement FCM token registration (Phase 2)

### Permission denied errors
- Review Firestore security rules
- Confirm user role is correct
- Check account is not suspended

---

**Version**: Phase 1 (January 2025)  
**Status**: Production Ready  
**Next Phase**: Video calling integration + FCM push notifications
