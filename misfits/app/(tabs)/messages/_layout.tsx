import { Stack } from 'expo-router';
import { colors } from '../../../constants/theme';

export default function MessagesLayout() {
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
        options={{ title: 'Messages' }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ title: 'Chat' }} 
      />
    </Stack>
  );
}
