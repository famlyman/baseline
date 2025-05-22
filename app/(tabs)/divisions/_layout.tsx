// app/(tabs)/divisions/_layout.tsx
import { Stack } from 'expo-router';

export default function DivisionsStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]" // Your DivisionStandingsScreen
        options={{ headerShown: false }}
      />
    </Stack>
  );
}