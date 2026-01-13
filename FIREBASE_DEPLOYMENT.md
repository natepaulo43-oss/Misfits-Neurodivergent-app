# Firebase Security Rules Deployment Guide

## Overview

This document explains how to deploy the Firestore security rules for the Misfits neurodivergent mentorship app.

## Files

- **`firestore.rules`** - Complete Firestore security rules for all collections

## Collections Covered

The security rules cover the following Firestore collections:

1. **users** - User profiles and account data
2. **threads** - Message thread metadata
3. **threads/{threadId}/messages** - Individual messages (subcollection)
4. **curatedContent** - Admin-curated educational content
5. **matches** - Student-mentor match records
6. **sessions** - Scheduled mentorship sessions
7. **books** - Book marketplace items (future)
8. **purchases** - Book purchase records (future)

## Key Security Features

### Role-Based Access Control
- **Students**: Can read mentors, create threads, send messages, view their matches/sessions
- **Mentors**: Can read students, respond to messages, view their matches/sessions
- **Admins/Super Admins**: Full read/write access to all collections, moderation capabilities

### Account Status Checks
- Suspended accounts cannot write data
- Users with `messagingDisabled` cannot send messages
- Users with `mentorMatchingDisabled` are filtered out from mentor queries

### Data Protection
- Users can only read/write their own profile data (except admins)
- Message participants can only access their own threads
- Messages and threads cannot be deleted (audit trail preservation)
- Admins can review flagged messages but cannot delete them

### Privacy Controls
- Thread participants must be in `participantIds` array to access
- Students/mentors can only see their own matches and sessions
- Published content is public; draft content is admin-only

## Deployment Methods

### Method 1: Firebase Console (Recommended for Testing)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules`
5. Paste into the rules editor
6. Click **Publish**

### Method 2: Firebase CLI (Recommended for Production)

1. Install Firebase CLI if not already installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Accept default `firestore.rules` file location
   - Accept default `firestore.indexes.json` file location

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. Verify deployment:
   ```bash
   firebase firestore:rules:list
   ```

## Testing the Rules

### Using Firebase Emulator (Local Testing)

1. Start the Firestore emulator:
   ```bash
   firebase emulators:start --only firestore
   ```

2. Update your app's Firebase config to use the emulator:
   ```typescript
   // In services/firebase.ts (for development only)
   import { connectFirestoreEmulator } from 'firebase/firestore';
   
   if (__DEV__) {
     connectFirestoreEmulator(db, 'localhost', 8080);
   }
   ```

### Manual Testing Checklist

After deploying rules, test the following scenarios:

#### As Student
- ✅ Can read own profile
- ✅ Can update own profile
- ✅ Can read mentor profiles
- ✅ Can create message threads
- ✅ Can send messages in own threads
- ✅ Can read own matches
- ❌ Cannot read other students' threads
- ❌ Cannot access admin-only content

#### As Mentor
- ✅ Can read own profile
- ✅ Can update own profile
- ✅ Can read student profiles (for matching)
- ✅ Can respond to messages in own threads
- ✅ Can read own matches and sessions
- ❌ Cannot access other mentors' threads
- ❌ Cannot create/modify matches

#### As Admin
- ✅ Can read all users
- ✅ Can update any user
- ✅ Can read all threads and messages
- ✅ Can flag/review messages
- ✅ Can create/update/delete curated content
- ✅ Can create/update/delete matches
- ✅ Can manage sessions

#### Suspended Account
- ❌ Cannot write any data
- ❌ Cannot send messages
- ✅ Can still read (to see suspension notice)

## Common Issues & Solutions

### Issue: "Missing or insufficient permissions"

**Cause**: User doesn't have the required role or the rules are too restrictive.

**Solutions**:
1. Check user's `role` field in Firestore
2. Verify user is authenticated (`request.auth != null`)
3. Check if account is suspended or messaging is disabled
4. Review the specific collection rules

### Issue: Rules deployment fails

**Cause**: Syntax error in rules file.

**Solutions**:
1. Validate rules syntax in Firebase Console
2. Check for missing semicolons or brackets
3. Ensure all helper functions are defined before use

### Issue: App still shows permission errors after deployment

**Cause**: Rules may take a few seconds to propagate.

**Solutions**:
1. Wait 10-30 seconds after deployment
2. Refresh the app
3. Clear app cache/data
4. Check Firebase Console to confirm rules are published

## Environment Variables Required

Ensure your `.env` file has the following Firebase configuration:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Next Steps

After deploying the rules:

1. ✅ Test with different user roles (student, mentor, admin)
2. ✅ Verify suspended accounts cannot write data
3. ✅ Test message thread creation and access
4. ✅ Verify curated content visibility
5. ✅ Test match and session access controls
6. 🔄 Set up Firebase monitoring/alerts for rule violations
7. 🔄 Review Firebase usage logs regularly

## Security Best Practices

1. **Never expose admin credentials** in client-side code
2. **Regularly audit** Firebase logs for suspicious activity
3. **Use Firebase App Check** to prevent abuse (optional but recommended)
4. **Monitor rule violations** in Firebase Console
5. **Keep rules updated** as app features evolve
6. **Test rules thoroughly** before production deployment

## Support

For issues or questions:
- Check Firebase documentation: https://firebase.google.com/docs/firestore/security/get-started
- Review Firebase Console logs
- Test rules in Firebase Emulator before production deployment
