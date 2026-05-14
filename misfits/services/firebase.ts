import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from 'firebase/app-check';
import Constants from 'expo-constants';
import { Platform, NativeModules } from 'react-native';

// Resolve Firebase config from (in priority order):
//   1. Constants.expoConfig.extra.firebase (set by app.config.js, includes
//      hardcoded public-key fallbacks so production always has values)
//   2. process.env.EXPO_PUBLIC_FIREBASE_* (local dev / web bundles)
const expoExtraFirebase = (Constants.expoConfig?.extra?.firebase ?? {}) as Partial<{
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}>;

const firebaseConfig = {
  apiKey: expoExtraFirebase.apiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: expoExtraFirebase.authDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: expoExtraFirebase.projectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: expoExtraFirebase.storageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: expoExtraFirebase.messagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: expoExtraFirebase.appId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // IMPORTANT: do NOT throw here. A throw on launch surfaces the global
  // ErrorBoundary "Oops!" screen, which Apple flags under Guideline 2.1(a)
  // ("the app displayed an error message upon launch"). We log loudly for
  // diagnostics and let downstream API calls fail with their own, more
  // contextual errors (e.g. on the login screen).
  console.error('[firebase] Missing required Firebase configuration', {
    apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
    authDomain: firebaseConfig.authDomain ? 'SET' : 'MISSING',
    projectId: firebaseConfig.projectId ? 'SET' : 'MISSING',
    storageBucket: firebaseConfig.storageBucket ? 'SET' : 'MISSING',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'SET' : 'MISSING',
    appId: firebaseConfig.appId ? 'SET' : 'MISSING',
    expoExtraKeys: Constants.expoConfig?.extra ? Object.keys(Constants.expoConfig.extra) : 'none',
  });
}

const app: FirebaseApp = initializeApp(firebaseConfig as Record<string, string>);

const isDebugAppCheck = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN === 'true';

if (typeof window !== 'undefined' && isDebugAppCheck) {
  (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

let webAppCheckInstance: AppCheck | null = null;

// True only when the react-native-firebase App Check native module is linked in this build.
const isNativeAppCheckAvailable = (): boolean => {
  try {
    return !!(NativeModules.RNFBAppCheckModule);
  } catch {
    return false;
  }
};

const initializeAppCheckForPlatform = (): void => {
  if (webAppCheckInstance) return;

  try {
    if (Platform.OS === 'web') {
      const siteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;
      if (!siteKey) return;
      webAppCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      return;
    }

    if ((Platform.OS === 'ios' || Platform.OS === 'android') && isNativeAppCheckAvailable()) {
      // Native provider initialization goes here once RNFBAppCheckModule is linked.
    }
  } catch {
    // App Check is best-effort; the app runs fully without it.
  }
};

initializeAppCheckForPlatform();

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { auth, db, app };
export default app;
