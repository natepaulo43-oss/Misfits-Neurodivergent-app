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
    if (user.pendingRole === 'mentor') {
      if (user.mentorApplicationStatus === 'submitted') {
        return <Redirect href="/(onboarding)/mentor-submitted" />;
      }
      return <Redirect href="/(onboarding)/mentor" />;
    }
    return <Redirect href="/(auth)/role-selection" />;
  }

  if (!user.onboardingCompleted && user.role === 'student') {
    return <Redirect href="/(onboarding)/student" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
