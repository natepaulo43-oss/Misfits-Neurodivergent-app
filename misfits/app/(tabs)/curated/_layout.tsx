import { Stack } from 'expo-router';

export default function CuratedLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Content',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
