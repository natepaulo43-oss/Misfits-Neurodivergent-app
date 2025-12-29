import { Stack } from 'expo-router';
import { colors } from '../../../constants/theme';

export default function BooksLayout() {
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
        options={{ title: 'Books' }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ title: 'Book Details' }} 
      />
    </Stack>
  );
}
