# The Misfits Project - Phase 1 MVP

A mobile app connecting neurodiverse students with mentors and curated books.

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Routing**: Expo Router (file-based)
- **Backend**: Firebase (Auth, Firestore, App Check, MFA are production; book purchase flow is currently a stub)

## Getting Started

### Quick Start (Expo Go)

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Then:
# - Press 'i' for iOS Simulator (Mac only)
# - Scan QR code with Expo Go app on physical device
# - Press 'w' for web browser
```

### Environment Variables

Your `.env` file is already configured with Firebase credentials. If you need to update it:

```bash
# Copy example file
cp .env.example .env

# Edit with your Firebase project credentials
```

**Important**: 
- Values prefixed with `EXPO_PUBLIC_` are exposed to the client
- Never commit `.env` files (already in `.gitignore`)
- For production builds, use EAS Secrets or your CI/CD secret manager

### Testing on Physical iOS Device

1. Install **Expo Go** from the App Store
2. Ensure device and computer are on the same WiFi network
3. Run `npm start` in terminal
4. Scan the QR code with your camera
5. App opens in Expo Go

See `docs/TESTING_GUIDE.md` for comprehensive testing instructions.

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

Most Firebase calls in `/services/` are production, not stubbed:

- `services/auth.ts` - Firebase Auth (production)
- `services/mentors.ts` - Firestore mentors collection (production, with a logged fallback to mock data if Firestore returns nothing)
- `services/books.ts` - Firestore books collection (stub — returns mock data, `purchaseBook()` doesn't create a real transaction)
- `services/messages.ts` - Firestore messages/threads

## Out of Scope (Phase 1)

- Payments (Stripe, Apple Pay)
- Video/voice calls
- Parent dashboards
- Ratings/reviews
- AI matching
- Push notifications

---

## 🚀 Current Status

### ✅ Ready for Development & Testing
- **Environment**: Expo Go (rapid development)
- **Firebase**: Web SDK fully integrated
- **Features**: All core functionality working
- **Testing**: Ready for iOS device testing

### 📱 Testing in Expo Go
The app is currently optimized for **Expo Go** development:
- ✅ Full Firebase Authentication (email, Google)
- ✅ Firestore database operations
- ✅ All app features functional
- ✅ Hot reload for rapid iteration
- ✅ Test on real iOS devices instantly

### 🎯 Next Steps

**For Development & Testing** (Current Phase):
1. Test all features in Expo Go
2. Iterate on UI/UX based on feedback
3. Validate business logic and flows
4. See `docs/TESTING_GUIDE.md` for test checklist

**For Production Build** (Future Phase):
1. Transition to EAS development build
2. Add React Native Firebase for native App Check
3. Configure iOS provisioning profiles
4. Submit to TestFlight, then App Store
5. See `docs/EXPO_GO_TO_PRODUCTION.md` for full guide

---

## 📚 Documentation

- **[Testing Guide](../docs/TESTING_GUIDE.md)** - Comprehensive testing checklist
- **[Expo Go → Production](../docs/EXPO_GO_TO_PRODUCTION.md)** - Transition guide
- **[iOS Production Checklist](../docs/IOS_PRODUCTION_CHECKLIST.md)** - App Store prep
- **[Firebase App Check](../docs/FIREBASE_APP_CHECK.md)** - Security setup

---

## 🛠️ Development Commands

```bash
# Start development server
npm start

# Start with cache cleared
npm start --clear

# Run on iOS simulator (Mac only)
npm run ios

# Run on Android emulator
npm run android

# Open in web browser
npm run web

# TypeScript type checking
npx tsc --noEmit
```

---

## 🔥 Firebase Configuration

**Current Setup**:
- Project: `misfits-fe486`
- Authentication: Email/Password, Google
- Database: Cloud Firestore
- Security: Firestore Rules enforced

**Web SDK** (Current):
- Works in Expo Go ✅
- Full feature support ✅
- Perfect for development ✅

**Native SDK** (Production):
- Requires development build
- Adds App Attest/DeviceCheck
- Needed for App Store submission

---

## 💡 Tips

- **Shake device** in Expo Go to open developer menu
- **Enable Fast Refresh** for instant updates
- **Use Debug Remote JS** for Chrome DevTools
- **Monitor Firebase Console** while testing
- **Check terminal logs** for errors

---

## 🐛 Troubleshooting

**App won't load in Expo Go?**
- Ensure same WiFi network
- Check `.env` file exists
- Run `npm start --clear`

**Firebase errors?**
- Verify `.env` credentials
- Check Firebase Console for project status
- Review Firestore security rules

**Build errors?**
- Run `npm install` to update dependencies
- Clear Metro cache: `npm start --clear`
- Delete `node_modules` and reinstall

---

## 📞 Support

For issues or questions:
1. Check documentation in `docs/` folder
2. Review Firebase Console logs
3. Check Expo Go developer menu
4. Review terminal output for errors
