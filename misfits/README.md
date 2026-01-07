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

### Environment variables

Copy `.env.example` to `.env` (and keep it out of git—already handled via the repo-level `.gitignore`) and fill each Firebase value:

```
cp .env.example .env
```

- Values prefixed with `EXPO_PUBLIC_` are exposed to the Expo client at build time, so only include non-privileged web credentials.
- For production builds (EAS, CI), configure the same variables using the platform’s secret manager so they’re injected without committing them.

If you need privileged Firebase Admin access, keep those credentials on a backend service (Cloud Functions, Next.js API routes, etc.) instead of the client.

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
- Video/voice calls
- Parent dashboards
- Ratings/reviews
- AI matching
- Push notifications
