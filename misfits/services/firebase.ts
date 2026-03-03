import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from 'firebase/app-check';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const firebaseConfig = Constants.expoConfig?.extra?.firebase || {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase config:', {
    apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
    authDomain: firebaseConfig.authDomain ? 'SET' : 'MISSING',
    projectId: firebaseConfig.projectId ? 'SET' : 'MISSING',
    storageBucket: firebaseConfig.storageBucket ? 'SET' : 'MISSING',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'SET' : 'MISSING',
    appId: firebaseConfig.appId ? 'SET' : 'MISSING',
  });
  console.error('Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
  throw new Error('Missing required Firebase configuration. Check Vercel environment variables.');
}

console.log('Initializing Firebase with project:', firebaseConfig.projectId);

const app: FirebaseApp = initializeApp(firebaseConfig);

const isDebugAppCheck = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN === 'true';

if (typeof window !== 'undefined' && isDebugAppCheck) {
  (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

let webAppCheckInstance: AppCheck | null = null;

let nativeAppCheckInitialized = false;

const initializeNativeAppCheck = async () => {
  if (nativeAppCheckInitialized) {
    return;
  }

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    console.warn('Native App Check skipped: not on iOS or Android');
    return;
  }

  console.warn('⚠️ Native App Check skipped: Requires development build with native modules.');
  console.warn('   For production: Run `npx expo run:ios` or `npx expo run:android`');
  nativeAppCheckInitialized = true;
};

const initializeAppCheckForPlatform = (): AppCheck | null => {
  if (webAppCheckInstance) {
    return webAppCheckInstance;
  }

  try {
    if (Platform.OS === 'web') {
      const siteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;

      if (!siteKey) {
        console.warn(
          '⚠️ Missing EXPO_PUBLIC_RECAPTCHA_SITE_KEY. App Check cannot be initialized for web without a reCAPTCHA Enterprise site key.',
        );
        return null;
      }

      webAppCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log('✅ App Check initialized for web via reCAPTCHA Enterprise');
      return webAppCheckInstance;
    }

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      console.log(`Initializing native App Check for ${Platform.OS}`);
      void initializeNativeAppCheck();
      return null;
    }

    console.warn('App Check initialization skipped: unsupported platform', Platform.OS);
    return null;
  } catch (error) {
    console.error('Failed to initialize App Check:', error);
    return null;
  }
};

initializeAppCheckForPlatform();

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

console.log('Firebase initialized successfully');

export { auth, db, app };
export default app;
