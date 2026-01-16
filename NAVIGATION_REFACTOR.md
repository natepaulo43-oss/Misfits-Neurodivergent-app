# Navigation Refactor - 4-Tab Structure

## Overview

The Misfits app navigation has been refactored from a fragmented 6+ tab structure to a clean, intuitive 4-tab bottom navigation that consolidates features and improves user experience.

## Previous Structure (Before Refactor)

**Bottom Tabs (6+):**
- Home
- Mentors
- Books
- Messages
- Library (Curated)
- Profile

**Separate Screens:**
- Sessions (standalone tab)
- Book Session (standalone screen)
- Session Detail (standalone screen)
- Availability Setup (standalone screen)

**Issues:**
- Too many tabs causing cognitive overload
- Feature fragmentation (Books vs Library, Messages vs Sessions)
- Scheduling features scattered across multiple entry points
- Not intuitive for first-time users

## New Structure (After Refactor)

### Bottom Navigation (4 Tabs Only)

**1. Home** (Left)
- Welcome card with personalized greeting
- Quick Access buttons:
  - Browse Mentors
  - Browse Books (students) / Messages (mentors)
  - Library
- Hub for accessing Books and Library content
- No longer separate bottom tabs

**2. Mentors** (Middle-Left)
- Browse mentor profiles
- View mentor details
- Search and filter mentors
- Book sessions from mentor profiles

**3. Messages** (Middle-Right)
- **Unified Messages + Scheduling hub**
- Segmented control with two views:
  - **Chats**: All message threads
  - **Sessions**: All session requests and bookings
- Sessions view includes:
  - Pending session requests (with badge count)
  - Upcoming confirmed sessions
  - Past sessions
  - "Book a Session" CTA for students
- Clicking session opens Session Detail screen
- All scheduling flows accessible from here

**4. Profile** (Right)
- User profile information
- Edit profile button
- **Manage Availability** button (mentors only)
- Availability Setup moved here from standalone screen
- Log out

### Hidden Screens (Not in Bottom Bar)

These screens are accessible via navigation but don't appear as bottom tabs:
- `books` - Accessed from Home Quick Access
- `curated` - Accessed from Home Quick Access
- `sessions` - Legacy route, now integrated into Messages tab
- `session-detail` - Accessed from Messages → Sessions
- `book-session` - Accessed from mentor profiles
- `availability-setup` - Accessed from Profile (mentors only)

## Key Changes

### 1. Messages + Scheduling Consolidation

**Before:**
- Messages: Separate tab
- Sessions: Separate tab
- Book Session: Separate screen
- Session Detail: Separate screen

**After:**
- Single "Messages" tab with internal segmented control
- Chats and Sessions in one unified interface
- Natural workflow: message mentor → book session → track sessions
- Pending session count badge on Sessions segment

### 2. Home as Content Hub

**Before:**
- Books: Separate bottom tab
- Library (Curated): Separate bottom tab
- Home: Just welcome screen

**After:**
- Home includes Quick Access to Books and Library
- Books and Library removed from bottom navigation
- Cleaner, less cluttered tab bar
- All content discovery starts from Home

### 3. Profile Contains Mentor Settings

**Before:**
- Availability Setup: Floating screen or separate tab
- Profile: Just user info

**After:**
- Profile includes "Manage Availability" button for mentors
- Availability Setup accessed from Profile
- All user settings in one place
- Role-based UI (only mentors see availability)

## User Flows

### Student: Book a Session

1. Tap **Messages** tab
2. Switch to **Sessions** segment
3. Tap "Book a Session" CTA
4. Redirected to **Mentors** tab to browse
5. Select mentor → Book session from profile
6. Return to Messages → Sessions to track request

### Mentor: Manage Availability

1. Tap **Profile** tab
2. Tap "Manage Availability" button
3. Set weekly schedule, buffer times, session durations
4. Save and return to Profile

### Mentor: Handle Session Request

1. Tap **Messages** tab
2. See badge on **Sessions** segment (pending count)
3. Switch to Sessions view
4. Tap pending session
5. Accept, Decline, or Suggest Reschedule

### Any User: Access Library

1. Tap **Home** tab
2. Tap "Library" in Quick Access
3. Browse curated content

## Technical Implementation

### Files Modified

1. **`app/(tabs)/_layout.tsx`**
   - Reduced to 4 visible tabs
   - Hidden screens marked with `href: null`
   - Documented previous structure in comments

2. **`app/(tabs)/home.tsx`**
   - Updated Quick Access buttons
   - Added Library access for all users
   - Simplified role-based CTAs

3. **`app/(tabs)/messages/index.tsx`**
   - Added segmented control (Chats/Sessions)
   - Integrated session list with status badges
   - Added "Book a Session" CTA for students
   - Pending session count badge
   - Unified data loading for threads and sessions

4. **`app/(tabs)/profile.tsx`**
   - Added "Manage Availability" button for mentors
   - Role-based UI rendering

### Routing Structure

```
/(tabs)
├── home (TAB 1)
├── mentors (TAB 2)
│   ├── index
│   ├── browse
│   ├── [id]
│   └── match-details
├── messages (TAB 3)
│   ├── index (Chats + Sessions segmented)
│   └── [id] (Chat detail)
├── profile (TAB 4)
├── books (hidden, accessed from Home)
├── curated (hidden, accessed from Home)
├── sessions (hidden, legacy)
├── session-detail (hidden, accessed from Messages)
├── book-session (hidden, accessed from Mentors)
└── availability-setup (hidden, accessed from Profile)
```

## Benefits

### User Experience
- **Reduced cognitive load**: 4 tabs vs 6+ tabs
- **Logical grouping**: Related features together
- **Natural workflows**: Messages and scheduling in one place
- **Less navigation**: Fewer taps to reach features
- **Cleaner interface**: Minimal, focused bottom bar

### Developer Experience
- **Maintainable structure**: Clear hierarchy
- **Documented changes**: Comments explain refactor
- **Backward compatible**: Old routes still work (hidden)
- **Role-based logic**: Preserved throughout

### Mobile Optimization
- **Thumb-friendly**: 4 tabs fit comfortably on mobile screens
- **No overflow**: All tabs visible without scrolling
- **Clear labels**: Intuitive tab names
- **Consistent icons**: Standard Ionicons throughout

## Migration Notes

### For Users
- No data loss - all features still accessible
- Scheduling moved to Messages tab (Sessions segment)
- Books/Library accessed from Home Quick Access
- Mentor availability in Profile settings

### For Developers
- Old routes still work (marked as hidden)
- No breaking changes to backend/services
- UI-only refactor, no data model changes
- Can safely remove hidden routes in future cleanup

## Future Enhancements

- Add search/filter in Messages → Sessions
- Session calendar view option
- Quick actions from session list (accept/decline inline)
- Notification badges on tab icons
- Swipe gestures between Chats/Sessions
- Session analytics in Profile

## Testing Checklist

- [x] 4 tabs visible in bottom navigation
- [x] Home Quick Access buttons work
- [x] Messages segmented control switches views
- [x] Sessions list displays correctly
- [x] Session detail accessible from Messages
- [x] Profile shows availability for mentors only
- [x] Availability setup accessible from Profile
- [x] Books/Library accessible from Home
- [x] No broken navigation links
- [x] Role-based UI renders correctly
- [x] Pending session badge displays count
- [x] All hidden routes still accessible

---

**Version**: 1.0  
**Date**: January 2026  
**Status**: Complete  
**Impact**: UI/Navigation only - No backend changes
