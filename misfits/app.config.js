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
      supportsTablet: false,
      bundleIdentifier: "com.misfits.app",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription: "Take a profile photo to help mentors and students recognize each other and build trust in our neurodivergent community.",
        NSPhotoLibraryUsageDescription: "Choose a profile photo from your library to personalize your account and help others in the community connect with you.",
        NSMicrophoneUsageDescription: "Enable voice messages to communicate more naturally with your mentor or student, especially helpful for those who prefer speaking over typing.",
        NSLocationWhenInUseUsageDescription: "Find mentors and students near you to enable in-person meetups and local community connections.",
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
      eas: {
        projectId: "99733b36-7c92-4484-adcc-e3f58a7bf254"
      },
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
