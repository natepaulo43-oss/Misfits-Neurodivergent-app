import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user.role) {
    return <Redirect href="/(auth)/role-selection" />;
  }

  if (!user.onboardingCompleted) {
    const destination =
      user.role === 'mentor' ? '/(onboarding)/mentor' : '/(onboarding)/student';
    return <Redirect href={destination} />;
  }

  return <Redirect href="/(tabs)/home" />;
}
