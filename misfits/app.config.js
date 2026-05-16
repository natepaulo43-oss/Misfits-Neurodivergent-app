// Public Firebase web client config and OAuth client IDs.
// These are NOT secrets: Firebase web/iOS client config is meant to be embedded
// in client apps (security is enforced via Firestore rules + App Check).
// Hardcoding them as a fallback guarantees EAS production builds always have
// the values even if a .env file is not uploaded to the build server.
const FIREBASE_FALLBACK = {
  apiKey: "AIzaSyAiHXOrZR4NSQP_7OJOMYERyZk14fhsScU",
  authDomain: "misfits-fe486.firebaseapp.com",
  projectId: "misfits-fe486",
  storageBucket: "misfits-fe486.firebasestorage.app",
  messagingSenderId: "845863899218",
  appId: "1:845863899218:web:1fb1d06aedad404b44cf8b"
};

const GOOGLE_IOS_REVERSED_CLIENT_ID_FALLBACK =
  "com.googleusercontent.apps.845863899218-rkvf4mdm6e1jts0f5dr2bq6i5tvj67cd";
const GOOGLE_IOS_CLIENT_ID_FALLBACK =
  "845863899218-rkvf4mdm6e1jts0f5dr2bq6i5tvj67cd.apps.googleusercontent.com";
const MATCHING_API_URL_FALLBACK =
  "https://examplecallablefunction-syts7okgra-uc.a.run.app";

const reversedClientId =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID || GOOGLE_IOS_REVERSED_CLIENT_ID_FALLBACK;

module.exports = {
  expo: {
    name: "The Misfits Project",
    slug: "misfits",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.misfits.app",
      buildNumber: "11",
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist",
      infoPlist: {
        // NOTE: Do NOT manually set CFBundleExecutable / CFBundleName /
        // CFBundleIdentifier / CFBundleVersion / CFBundleShortVersionString /
        // CFBundlePackageType / CFBundleInfoDictionaryVersion /
        // CFBundleSignature / CFBundleDevelopmentRegion here. Expo/EAS
        // populates them automatically from the top-level expo config
        // (`name`, `slug`, `version`, `ios.bundleIdentifier`,
        // `ios.buildNumber`). Overriding CFBundleExecutable in particular
        // breaks launch on real devices because iOS looks for a binary with
        // that exact name inside the .ipa and the EAS-built binary is named
        // after the slug, not "TheMisfitsProject".
        CFBundleDisplayName: "The Misfits Project",
        LSRequiresIPhoneOS: true,
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          { CFBundleURLSchemes: [reversedClientId] }
        ],
        UISupportedInterfaceOrientations: [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationPortraitUpsideDown"
        ]
        // UIAppFonts intentionally omitted: the project does not ship any
        // OpenSans .ttf files. Listing missing fonts here causes iOS to log
        // launch-time font registration errors. Re-add ONLY when the .ttf
        // files actually exist in `assets/fonts/` and are wired via the
        // expo-font plugin.
      },
      icon: "./assets/icon.png",
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      }
    },
    android: {
      package: "com.misfits.app"
    },
    web: {
      bundler: "metro"
    },
    scheme: "misfits",
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-apple-authentication"
    ],
    extra: {
      eas: {
        projectId: "99733b36-7c92-4484-adcc-e3f58a7bf254"
      },
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || FIREBASE_FALLBACK.apiKey,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || FIREBASE_FALLBACK.authDomain,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || FIREBASE_FALLBACK.projectId,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || FIREBASE_FALLBACK.storageBucket,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_FALLBACK.messagingSenderId,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || FIREBASE_FALLBACK.appId
      },
      googleIosClientId:
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || GOOGLE_IOS_CLIENT_ID_FALLBACK,
      googleIosReversedClientId: reversedClientId,
      matchingApiUrl: process.env.EXPO_PUBLIC_MATCHING_API_URL || MATCHING_API_URL_FALLBACK
    }
  }
};
