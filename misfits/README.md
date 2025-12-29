# Misfits - Phase 1 MVP

A mobile app connecting neurodiverse students with mentors and curated books.

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Routing**: Expo Router (file-based)
- **Backend**: Firebase (stubbed for MVP)

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

## Project Structure

```
misfits/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Authentication flow
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── role-selection.tsx
│   ├── (tabs)/              # Main tab navigation
│   │   ├── home.tsx
│   │   ├── mentors/         # Mentor list & detail
│   │   ├── books/           # Book list & detail
│   │   ├── messages/        # Message threads & chat
│   │   └── profile.tsx
│   ├── _layout.tsx          # Root layout
│   └── index.tsx            # Entry redirect
├── components/              # Reusable UI components
├── constants/               # Theme & design tokens
├── context/                 # React context (Auth)
├── data/                    # Mock data files
├── services/                # API service stubs
└── types/                   # TypeScript interfaces
```

## Features (Phase 1)

- ✅ Email/password authentication
- ✅ Role-based experience (Student, Mentor)
- ✅ Mentor browsing and profiles
- ✅ Book marketplace browsing
- ✅ Book detail views with mock purchase
- ✅ Basic 1-on-1 messaging
- ✅ User profile with editable fields

## Design Principles

- Calm, clear, accessible UI
- White background with soft blue accent
- Rounded cards and buttons
- Large tap targets
- No heavy animations or gradients

## Firebase Integration Points

All Firebase calls are stubbed in `/services/`. Look for `TODO` comments indicating where to connect:

- `services/auth.ts` - Firebase Auth
- `services/mentors.ts` - Firestore mentors collection
- `services/books.ts` - Firestore books collection
- `services/messages.ts` - Firestore messages/threads

## Out of Scope (Phase 1)

- Payments (Stripe, Apple Pay)
- Scheduling/calendars
- Video/voice calls
- Parent dashboards
- Ratings/reviews
- AI matching
- Push notifications
