# Misfits - Neurodivergent Support App

A React Native app built with Expo for supporting neurodivergent individuals.

## 🚨 Quick Fix: App Check Error in Expo Go

If you see `auth/firebase-app-check-token-is-invalid` error:

**Immediate Solution:**
1. Go to [Firebase Console](https://console.firebase.google.com/) → **misfits-fe486**
2. Navigate to **Build > App Check** → **APIs** tab
3. Set all services to **Monitor** mode (NOT Enforce)
4. Restart your app

**Details**: See [`docs/EXPO_GO_DEVELOPMENT.md`](./docs/EXPO_GO_DEVELOPMENT.md)

---

## 🚀 Quick Start

### Development (Expo Go)

```bash
cd misfits
npm install
npm start
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp misfits/.env.example misfits/.env
   ```

2. Add your Firebase credentials to `.env`:
   ```bash
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
   EXPO_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:abcdef123456
   ```

3. **Important**: Set App Check to Monitor mode in Firebase Console (see above)

---

## 📱 Project Structure

```
Neurodivergent/
├── misfits/              # Main React Native app
│   ├── app/             # Expo Router screens
│   ├── components/      # Reusable components
│   ├── services/        # Firebase & API services
│   ├── constants/       # App constants
│   └── assets/          # Images, fonts, etc.
├── functions/           # Firebase Cloud Functions
│   └── src/            # Function source code
├── docs/               # Documentation
└── scripts/            # Utility scripts
```

---

## 🔥 Firebase Configuration

### Services Used
- **Authentication**: Email/Password (Google Sign-In in production builds)
- **Firestore**: Real-time database
- **Cloud Functions**: Server-side logic
- **App Check**: Security & bot protection

### App Check Setup (Important!)

**For Expo Go Development:**
- Set App Check to **Monitor** mode in Firebase Console
- This allows development without native App Check providers
- See [`docs/EXPO_GO_DEVELOPMENT.md`](./docs/EXPO_GO_DEVELOPMENT.md)

**For Production:**
- Use native App Check providers (DeviceCheck/App Attest)
- Switch to **Enforce** mode after testing
- See [`docs/APP_CHECK_IOS_SETUP.md`](./docs/APP_CHECK_IOS_SETUP.md)

---

## 📚 Documentation

### Development Guides
- **[Expo Go Development](./docs/EXPO_GO_DEVELOPMENT.md)** - ⭐ Start here for Expo Go setup
- **[Google Sign-In Guide](./docs/GOOGLE_SIGNIN_GUIDE.md)** - Google authentication setup
- **[Testing Guide](./docs/TESTING_GUIDE.md)** - How to test the app

### Firebase & Security
- **[Firebase App Check](./docs/FIREBASE_APP_CHECK.md)** - App Check overview
- **[App Check iOS Setup](./docs/APP_CHECK_IOS_SETUP.md)** - iOS-specific setup
- **[Firebase Deployment](./docs/FIREBASE_DEPLOYMENT.md)** - Deploy Cloud Functions

### Production Deployment
- **[Expo Go to Production](./docs/EXPO_GO_TO_PRODUCTION.md)** - Transition guide
- **[iOS Production Checklist](./docs/IOS_PRODUCTION_CHECKLIST.md)** - Pre-launch checklist

---

## ✅ What Works in Expo Go

- ✅ Email/Password authentication
- ✅ Firebase Firestore (CRUD operations)
- ✅ Real-time data updates
- ✅ Cloud Functions (with Monitor mode)
- ✅ User management
- ✅ All core app features

## ⚠️ Requires Production Build

- ❌ Google Sign-In (iOS/Android)
- ❌ Native App Check providers
- ⚠️ Push notifications (limited)

**Note**: These are Expo Go platform limitations, not code issues. They work in development/production builds.

---

## 🛠️ Tech Stack

- **Framework**: React Native with Expo (~50.0.0)
- **Navigation**: Expo Router
- **Backend**: Firebase (Auth, Firestore, Functions)
- **Language**: TypeScript
- **Styling**: React Native StyleSheet
- **State Management**: React hooks

---

## 🔐 Security

- Firebase App Check enabled (Monitor mode for development)
- Firestore security rules enforce authentication
- Environment variables for sensitive config
- `.env` files gitignored

---

## 🧪 Testing

### Run in Expo Go
```bash
cd misfits
npm start
```

### Test Authentication
```typescript
// Email/Password works in Expo Go
await registerWithEmail('user@example.com', 'password123');
await loginWithEmail('user@example.com', 'password123');
```

### Test Firestore
```typescript
// All Firestore operations work in Expo Go
import { db } from '@/services/firebase';
import { collection, addDoc } from 'firebase/firestore';

await addDoc(collection(db, 'users'), { name: 'Test' });
```

---

## 🚀 Production Deployment

### Phase 1: Development (Current)
- Use Expo Go for rapid testing
- Email/Password authentication
- App Check in Monitor mode

### Phase 2: Development Build
```bash
npx expo run:ios
# or
npx expo run:android
```

### Phase 3: Production Build
```bash
npm install -g eas-cli
eas build --platform ios --profile production
eas submit --platform ios
```

See [`docs/IOS_PRODUCTION_CHECKLIST.md`](./docs/IOS_PRODUCTION_CHECKLIST.md) for complete guide.

---

## 🐛 Troubleshooting

### `auth/firebase-app-check-token-is-invalid`
**Solution**: Set App Check to Monitor mode in Firebase Console (see top of README)

### `Missing Firebase configuration`
**Solution**: Check your `.env` file has all required variables

### Google Sign-In not working in Expo Go
**Expected**: Google Sign-In requires a development build. Use email/password in Expo Go.

### More troubleshooting
See [`docs/EXPO_GO_DEVELOPMENT.md`](./docs/EXPO_GO_DEVELOPMENT.md#-troubleshooting)

---

## 📞 Support

For issues or questions:
1. Check the documentation in [`docs/`](./docs/)
2. Review Firebase Console for errors
3. Check application logs for detailed error messages

---

## 📄 License

[Add your license here]

---

## 🎯 Current Status

**Development Phase**: Expo Go testing
- ✅ Firebase configured and working
- ✅ Authentication functional (email/password)
- ✅ Firestore operations working
- ✅ App Check in Monitor mode
- ✅ Ready for Expo Go development

**Next Steps**:
1. Test all features in Expo Go
2. Validate business logic
3. Prepare for development build
4. Add Google Sign-In for production
5. Deploy to App Store

---

**Last Updated**: March 3, 2026
