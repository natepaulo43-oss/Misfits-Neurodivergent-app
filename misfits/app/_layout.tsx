import { Stack } from 'expo-router';
import { View } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { OfflineBanner, ErrorBoundary } from '../components';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(admin)" />
          </Stack>
        </View>
      </AuthProvider>
    </ErrorBoundary>
  );
}
