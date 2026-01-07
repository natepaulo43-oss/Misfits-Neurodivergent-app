import { Stack } from 'expo-router';
import { colors } from '../../../constants/theme';

export default function MentorsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Your Matches' }}
      />
      <Stack.Screen
        name="browse"
        options={{ title: 'Browse Mentors' }}
      />
      <Stack.Screen
        name="match-details"
        options={{ title: 'Why this match?' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Mentor Profile' }}
      />
    </Stack>
  );
}
