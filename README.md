# The Misfits Project

A mobile app connecting neurodivergent students with mentors and curated resources — built for a community that most mentorship platforms don't design for.

![Mentor matching screen](Ipad/Iphone/Screenshot%202026-04-30%20182755.png)

## Why I built it

Existing mentorship platforms aren't designed around neurodivergent needs — communication preferences, sensory considerations, and the specific kind of support that ADHD, autistic, and dyslexic students are actually looking for. The Misfits Project is a mentor-matching app built specifically for that community: students get matched with mentors based on support goals and communication style, not a generic profile browse.

## Tech Stack

- **React Native (Expo)**, TypeScript, file-based routing via Expo Router
- **Firebase** — Authentication, Cloud Firestore, App Check (device attestation)
- **EAS Build** for iOS/Android production builds

## Key technical decisions

- **App Store submission cycle, end to end**: shipped a build to Apple review, got rejected under Guideline 2.1(a) ("app displayed an error message upon launch"), root-caused it to an EAS production build silently dropping `.env` because `.easignore` didn't exist and inherited `.gitignore`'s exclusion rules, then fixed it (added `.easignore`, moved public Firebase config to a non-crashing fallback path) and re-submitted.
- **Firebase App Check + MFA** implemented for production auth hardening, not left as a stub.
- **Firestore security rules** written and iterated on to balance mentor/student data access against the app's matching logic, rather than left wide open for MVP convenience.

## Stack maturity

This isn't a UI mockup — it's a shipped product with a real deployment pipeline (EAS builds for iOS/Android), real production auth/security hardening, and a real App Store review cycle with a diagnosed and fixed rejection.

## Docs

- [Product Requirements Doc](docs/prd.md)
- [App Store rejection root-cause & fix](docs/APP_STORE_REJECTION_FIX_2026-05.md)
- [Matching engine API](misfits/server/MATCHING_API.md)

## Screenshots

<img src="Ipad/Screenshot%202026-04-30%20182834.png" width="45%" /> <img src="Ipad/Iphone/Screenshot%202026-04-30%20183158.png" width="45%" />
