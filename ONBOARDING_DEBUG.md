# Onboarding Flow Debug Guide

## Changes Made

### 1. Enhanced Error Logging
- **Mentor onboarding** (`misfits/app/(onboarding)/mentor.tsx`): Added detailed error messages showing the actual error instead of generic "failed to save"
- **Student onboarding** (`misfits/app/(onboarding)/student.tsx`): Added detailed error messages
- **Auth service** (`misfits/services/auth.ts`): Added console logging for profile updates
- **Firebase service** (`misfits/services/firebase.ts`): Added initialization logging and better error messages

### 2. What to Check Next

When you try to fill out the mentor profile again, you should now see:
1. Console logs showing "Updating user profile:" with the data being sent
2. A more specific error message if the save fails (e.g., "permission-denied", "network error", etc.)

### 3. Common Issues and Solutions

#### Issue: "Missing environment variable" error
**Solution**: Ensure your `.env` file exists in `misfits/` directory with all Firebase config variables

#### Issue: "permission-denied" error
**Possible causes**:
- User is not authenticated (check if `user.id` exists)
- Firestore rules are blocking the write
- User's account is suspended

**Debug steps**:
1. Check browser console for the full error message
2. Verify user is logged in: `console.log('Current user:', user)`
3. Check Firestore rules in Firebase Console

#### Issue: Network/connection errors
**Possible causes**:
- Firebase project is not accessible
- Network connectivity issues
- Wrong Firebase project ID in `.env`

**Debug steps**:
1. Verify Firebase project ID matches your actual project
2. Check Firebase Console to ensure Firestore is enabled
3. Test with a simple read operation first

### 4. Testing the Complete Flow

#### For Students:
1. Sign up with new account
2. Select "Student" role
3. Fill out student profile form
4. Submit - should redirect to home screen
5. Check Firestore Console to verify profile was saved

#### For Mentors:
1. Sign up with new account
2. Select "Mentor" role
3. Fill out mentor profile form (all required fields marked with *)
4. Submit - should redirect to "mentor-submitted" screen
5. Check Firestore Console to verify profile was saved with:
   - `pendingRole: 'mentor'`
   - `mentorApplicationStatus: 'submitted'`
   - `mentorProfile: { ... }` with all the form data

### 5. Firestore Rules Analysis

The current rules (`firestore.rules`) allow:
- **Line 63**: Users can write their own document if they own it and account is active
- **Line 66**: Admins can write any user document

This should work for onboarding. The rules do NOT require a specific role to update your own profile.

### 6. Next Steps for Debugging

1. **Clear browser cache and reload** - Sometimes stale Firebase connections cause issues
2. **Check browser console** - Look for the new detailed error messages
3. **Verify Firebase connection** - The console should show "Firebase initialized successfully"
4. **Check Network tab** - Look for failed Firestore API calls
5. **Test with a student profile first** - If student works but mentor doesn't, the issue is specific to mentor logic

### 7. If Issues Persist

If you still get errors after these changes, please share:
1. The exact error message from the alert
2. Console logs (especially the "Updating user profile:" log)
3. Any red errors in the browser console
4. Network tab showing the Firestore request/response

This will help identify if it's:
- A Firestore rules issue
- A data validation issue
- A network/connection issue
- A Firebase configuration issue
