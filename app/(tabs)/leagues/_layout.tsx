// app/(tabs)/leagues/_layout.tsx
import { Stack } from 'expo-router';
export default function LeaguesStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Leagues' }} />
      <Stack.Screen
        name="[id]" // Your LeagueDetailsScreen
        options={{
          headerShown: false,
          presentation: 'modal', // Or 'card' for standard push
          // <-- THIS IS WHERE THE MISSING OPTIONS GO!
        }}
      />
    </Stack>
  );
}