module.exports = {
  expo: {
    name: "Misfits",
    slug: "misfits",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.misfits.app"
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
      "expo-font"
    ],
    extra: {
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
      },
      matchingApiUrl: process.env.EXPO_PUBLIC_MATCHING_API_URL
    }
  }
};
