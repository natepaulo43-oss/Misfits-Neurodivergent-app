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
        options={{ title: 'Mentors' }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ title: 'Mentor Profile' }} 
      />
    </Stack>
  );
}
