module.exports = {
  expo: {
    name: "Misfits",
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
      supportsTablet: true,
      bundleIdentifier: "com.misfits.app",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to allow you to upload profile photos and share content.",
        NSPhotoLibraryUsageDescription: "This app accesses your photo library to allow you to upload profile photos and share content.",
        NSMicrophoneUsageDescription: "This app uses the microphone for voice messages and video calls.",
        CFBundleDevelopmentRegion: "en",
        CFBundleDisplayName: "Misfits",
        CFBundleExecutable: "Misfits",
        CFBundleIdentifier: "com.misfits.app",
        CFBundleInfoDictionaryVersion: "6.0",
        CFBundleName: "Misfits",
        CFBundlePackageType: "APPL",
        CFBundleShortVersionString: "1.0.0",
        CFBundleSignature: "????",
        CFBundleVersion: "1",
        LSRequiresIPhoneOS: true,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        },
        UIAppFonts: [
          "OpenSans-Regular.ttf",
          "OpenSans-SemiBold.ttf"
        ],
        UIRequiredDeviceCapabilities: [
          "armv7"
        ],
        UISupportedInterfaceOrientations: [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationPortraitUpsideDown"
        ]
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
