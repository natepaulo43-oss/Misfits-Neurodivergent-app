import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from 'firebase/app-check';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import appCheck from '@react-native-firebase/app-check';

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

  const isDebug = __DEV__ || isDebugAppCheck;

  const provider = appCheck().newReactNativeFirebaseAppCheckProvider();
  provider.configure({
    apple: {
      provider: isDebug ? 'debug' : 'appAttestWithDeviceCheckFallback',
      ...(isDebugAppCheck ? { debugToken: 'debug-token' } : {}),
    },
    android: {
      provider: isDebug ? 'debug' : 'playIntegrity',
      ...(isDebugAppCheck ? { debugToken: 'debug-token' } : {}),
    },
  });

  try {
    if (isDebug) {
      console.log(
        '🔐 App Check debug provider active. Register the printed debug token in Firebase Console > App Check > Debug tokens.',
      );
    }

    nativeAppCheckInitialized = true;
    console.log(`✅ Native App Check initialized using ${Platform.OS} provider`);
  } catch (error) {
    console.error('Failed to initialize native App Check provider', error);
  }
};

const initializeAppCheckForPlatform = (): AppCheck | null => {
  if (webAppCheckInstance) {
    return webAppCheckInstance;
  }

  if (Platform.OS === 'web') {
    const siteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!siteKey) {
      console.warn(
        'Missing EXPO_PUBLIC_RECAPTCHA_SITE_KEY. App Check cannot be initialized for web without a reCAPTCHA Enterprise site key.',
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
};

initializeAppCheckForPlatform();

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

console.log('Firebase initialized successfully');

export { auth, db, app };
export default app;
