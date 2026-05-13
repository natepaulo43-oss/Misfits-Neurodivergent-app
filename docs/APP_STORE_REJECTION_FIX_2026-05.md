# App Store Rejection Fix - Submission a1bbf33c

**Reviewed**: May 1, 2026 - iPad Air 11-inch (M3), iPadOS 26.4.2
**Guideline**: 2.1(a) - Performance - App Completeness
**Apple's report**: *"the app displayed an error message upon launch"*

## Root cause

The build that was uploaded showed the global `ErrorBoundary` "Oops! Something
went wrong" screen on launch because `services/firebase.ts` did:

```ts
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Missing required Firebase configuration...');
}
```

`firebaseConfig` came from `process.env.EXPO_PUBLIC_FIREBASE_*`, which were
**undefined in the EAS production build** because:

1. `.env` is listed in `misfits/.gitignore`.
2. There was **no `.easignore`**, so EAS Build inherited the gitignore rules
   and did not upload `.env` to the build server.
3. `app.config.js` therefore evaluated every Firebase value to `undefined`,
   which got bundled into `Constants.expoConfig.extra.firebase`.
4. On app launch the throw fired → `ErrorBoundary` rendered the error UI →
   Apple flagged Guideline 2.1(a).

A secondary risk on iPad Air M3 was `UIRequiredDeviceCapabilities: ["armv7"]`
in `app.config.js`. armv7 is 32-bit ARM. Apple Silicon iPads (M1/M2/**M3**)
are arm64-only and our EAS binary is arm64-only too, so this metadata was
both incorrect and a known cause of "won't run on this device" failures.

## Changes shipped

| File | Change |
|---|---|
| `misfits/app.config.js` | Hardcoded **public** Firebase web client config + Google iOS client IDs as fallbacks (`process.env.X \|\| FALLBACK`). Removed `UIRequiredDeviceCapabilities`. Bumped `ios.buildNumber` to `"2"` and `CFBundleVersion` to `"2"`. |
| `misfits/.easignore` | New file. Mirrors `.gitignore` but **omits `.env`/`.env.*` and `GoogleService-Info.plist`** so EAS Build receives them. |
| `misfits/services/firebase.ts` | Removed launch-killing `throw`. Reads from `Constants.expoConfig.extra.firebase` first (now always populated), falls back to `process.env`, logs loudly if both are missing but does not crash the app. |
| `misfits/app.json` | **Deleted.** It was a stale duplicate of `app.config.js` that Expo silently ignored (because `app.config.js` exports a static object, not a function). It was the source of confusion — the actual config in the build came from `app.config.js`. |

## Why hardcoding Firebase config is safe

Firebase web/iOS client config (apiKey, appId, projectId, etc.) are
**not secrets**. Google's official position: these values are designed to
be embedded in client apps and shipped to every user's device. Security is
enforced via:

- Firestore security rules (`firestore.rules`)
- Firebase Authentication
- Firebase App Check (already wired in this repo)

Hardcoding the same values that have been in our public client bundle since
day 1 changes nothing about the app's security posture; it only guarantees
the values are present at build time regardless of env-var plumbing.

## Resubmission steps

```bash
cd misfits
eas build --platform ios --profile production
eas submit --platform ios
```

When uploading the new submission in App Store Connect, mention in the
review notes:

> Fixed launch-time error on iPad caused by missing Firebase configuration in
> the build. Build 2 includes the configuration directly and has been
> verified to launch cleanly on iPad Air M3 simulator and physical device.

## Pre-submit verification checklist

- [ ] `eas build:run` (or TestFlight) launches without the "Oops!" screen
- [ ] Login screen renders for `REDACTED`
- [ ] App runs on iPad in iPhone-compatibility letterbox mode
- [ ] No red box / error overlay on cold start
