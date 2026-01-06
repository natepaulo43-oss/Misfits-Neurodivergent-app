# Product Requirements Document (PRD)
## Project: Misfits
## Phase: Phase 1 – MVP
## Objective: Build a clean, functional MVP that demonstrates core value with minimal scope creep.

---

## 1. PRODUCT GOAL

Misfits is a mobile app that connects neurodiverse students with mentors and provides access to curated, mission-aligned books.

Phase 1 is a functional MVP designed to:
- Validate product direction
- Demonstrate UX quality
- Enable early user feedback
- Avoid overengineering

This is NOT a full production build.

---

## 2. SCOPE DEFINITION (CRITICAL)

### INCLUDED IN PHASE 1
- Email/password authentication
- Role-based experience (Student, Mentor, Admin)
- Mentor browsing and profiles
- Book marketplace browsing
- Book detail views
- Mock purchase flow
- Basic 1-on-1 messaging
- Clean, accessible UI
- Mock data with clear backend integration points
- Scheduling or calendars

### EXPLICITLY OUT OF SCOPE
DO NOT  THIS YET:
- Payments (Stripe, Apple Pay, etc.)
- Video or voice calls
- Parent/guardian dashboards
- Ratings or reviews
- AI matching logic
- Content moderation dashboards
- Push notifications

If not listed above, assume it is out of scope.

---

## 3. TECH STACK (LOCKED – DO NOT DEVIATE)

### Frontend
- Expo (React Native)
- TypeScript
- Expo Router (file-based routing)
- Functional React components only
- Minimal, readable component structure

### Backend (Future Integration)
- Firebase (Auth, Firestore, Storage)
- Backend calls should be stubbed or mocked
- Clearly comment where Firebase will be connected

---

## 4. DESIGN & UX REQUIREMENTS

### Design Principles
- Calm
- Clear
- Accessible
- Friendly but professional
- No visual clutter

### Visual Rules
- White background
- Single soft accent color (blue or green)
- Rounded cards and buttons
- Large tap targets
- No heavy animations
- No gradients
- No unnecessary icons

### Typography
- Clear hierarchy
- Titles: 20–24px
- Body: 14–16px

---

## 5. USER ROLES

### Student
- Can browse mentors
- Can browse books
- Can message mentors
- Can view and edit basic profile info

### Mentor
- Has a public profile
- Can be messaged by students
- Cannot message students unless contacted first

### Admin (Minimal)
- Admin role exists
- App logic supports approved-only content
- Admin UI is NOT required in Phase 1

---

## 6. NAVIGATION STRUCTURE

Use a bottom tab navigator with exactly five tabs:

1. Home
2. Mentors
3. Books
4. Messages
5. Profile

Navigation should be consistent across all roles.

---

## 7. SCREEN REQUIREMENTS (PAGE-BY-PAGE)

### 7.1 AUTHENTICATION FLOW

#### Login Screen
- Email input
- Password input
- Login button
- Link to Signup screen

#### Signup Screen
- Name input
- Email input
- Password input
- Continue button
- Routes to Role Selection

#### Role Selection Screen
- Student option
- Mentor option
- Saves role and routes to Home

---

### 7.2 HOME TAB

- Welcome message using user name
- Short explanation of app purpose
- Two large buttons:
  - Browse Mentors
  - Browse Books

---

### 7.3 MENTORS TAB

#### Mentor List Screen
- Scrollable list
- Mentor card:
  - Profile image (placeholder)
  - Name
  - Expertise tags
  - Short bio preview

#### Mentor Detail Screen
- Profile image
- Name
- Full bio
- Expertise tags
- Message Mentor button

---

### 7.4 BOOKS TAB

#### Book List Screen
- Card-based list or grid
- Cover image
- Title
- Author
- Price

#### Book Detail Screen
- Large cover image
- Title
- Author
- Description
- Tags
- Price
- Buy Book button (mock purchase)

---

### 7.5 MESSAGES TAB

#### Message Threads Screen
- Thread list
- Other user name
- Last message preview

#### Chat Screen
- Message bubbles
- Timestamp
- Text input
- Send button
- Text only

---

### 7.6 PROFILE TAB

- Profile image placeholder
- Name
- Role
- Editable fields (stubbed):
  - Interests
  - Learning differences
- Logout button

---

## 8. DATA MODELS

### User
{
  id: string
  name: string
  email: string
  role: "student" | "mentor" | "admin"
}

### Mentor
{
  id: string
  name: string
  bio: string
  expertise: string[]
  approved: boolean
}

### Book
{
  id: string
  title: string
  author: string
  description: string
  price: number
  coverImage: string
  tags: string[]
  approved: boolean
}

### Message
{
  id: string
  fromUserId: string
  toUserId: string
  text: string
  timestamp: string
}

---

## 9. ADMIN LOGIC

- Only approved mentors are shown
- Only approved books are shown
- Admin approval handled manually in backend

---

## 10. EMPTY & EDGE STATES

- Empty mentors state
- Empty books state
- Empty messages state
- Loading indicators

---

## 11. IMPLEMENTATION GUIDELINES FOR AI

- Follow this PRD strictly
- Do not add features
- Favor clarity over abstraction
- Clearly comment backend integration points

---

## 12. SUCCESS CRITERIA

- App runs without errors
- Authentication works
- Mentor browsing works
- Book browsing works
- Messaging works
- UI is clean and intuitive
