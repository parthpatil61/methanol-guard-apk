import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="new-test"
        options={{
          title: 'New Test',
          headerShown: false,
        }}
      />
    </Stack>
  );
}