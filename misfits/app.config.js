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
      buildNumber: "1",
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist",
      infoPlist: {
        CFBundleDevelopmentRegion: "en",
        CFBundleDisplayName: "The Misfits Project",
        CFBundleExecutable: "TheMisfitsProject",
        CFBundleIdentifier: "com.misfits.app",
        CFBundleInfoDictionaryVersion: "6.0",
        CFBundleName: "The Misfits Project",
        CFBundlePackageType: "APPL",
        CFBundleShortVersionString: "1.0.0",
        CFBundleSignature: "????",
        CFBundleVersion: "1",
        LSRequiresIPhoneOS: true,
        CFBundleURLTypes: process.env.EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID
          ? [{ CFBundleURLSchemes: [process.env.EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID] }]
          : [],
        UIAppFonts: [
          "OpenSans-Regular.ttf",
          "OpenSans-SemiBold.ttf"
        ],
        ITSAppUsesNonExemptEncryption: false,
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
      "expo-font",
      "expo-web-browser"
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
