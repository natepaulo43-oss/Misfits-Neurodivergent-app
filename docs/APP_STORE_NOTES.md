# App Store Review Notes - Misfits

## Test Account Credentials

**Email:** REDACTED  
**Password:** [REDACTED]

### Login Instructions

1. Launch the Misfits app
2. On the welcome screen, tap "Sign In"
3. Enter the test account credentials above
4. Tap "Sign In" to access the app

**Note:** This test account has been pre-configured with sample data to demonstrate all app features. The account bypasses email verification requirements specifically for review purposes.

---

## App Overview

**Misfits** is a mentorship and community platform designed specifically for neurodivergent individuals (ADHD, autism, dyslexia, and other learning differences). The app provides:

- **Peer Mentorship:** Connect neurodivergent mentors with mentees
- **Community Support:** Safe space for sharing experiences and strategies
- **Resource Library:** Curated books and materials for neurodivergent success
- **Scheduling System:** Flexible meeting coordination respecting different communication styles

### Why Neurodivergent-Specific?

Our app serves a community that often faces unique challenges in traditional educational and professional settings. The neurodivergent focus explains our specific permission requests and UI/UX design choices optimized for different cognitive processing styles.

---

## Technical Notes

### Firebase App Check

This app uses **Firebase App Check** for enhanced security and abuse prevention. App Check is active in production mode and validates that requests come from legitimate app instances.

- **iOS Implementation:** Uses DeviceCheck/App Attest for device attestation
- **Purpose:** Prevents API abuse and protects user data
- **Impact:** No visible impact on user experience; runs transparently in background

### Permissions Requested

This version of the app does not request any sensitive device permissions (camera, photo library, microphone, or location are not used).

- **Notifications (Optional):** Infrastructure is in place (push token saved to Firestore) but the runtime permission prompt is not yet wired up in this build.

---

## Privacy & Data Handling

- **Privacy Policy URL:** https://erictacl.com/policies/privacy-policy
- **Data Collection:** Minimal - only email, display name, and user-provided profile information
- **Third-Party Services:** Firebase (Google) for authentication and database
- **Data Deletion:** Users can delete their account and all associated data from Settings

---

## Support Contact

For any questions during review, please contact:  
**Email:** support@misfits.com  
**Response Time:** Within 24 hours

---

## Build Information

- **Version:** 1.0.0
- **Bundle ID:** com.misfits.app
- **Framework:** Expo (React Native)
- **Minimum iOS Version:** 13.0+
- **Target Devices:** iPhone only (not optimized for iPad)
