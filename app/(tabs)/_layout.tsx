import { Ionicons } from '@expo/vector-icons'; // You'll need to install this: npm install @expo/vector-icons
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="Home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerTitle: 'Home', // Optional header title
        }}
      />
      <Tabs.Screen
        name="Leagues"
        options={{
          tabBarLabel: 'Leagues',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
          headerTitle: 'Leagues', // Optional header title
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          headerTitle: 'Profile', // Optional header title
        }}
      />
      {/* You can add more tabs here */}
    </Tabs>
  );
}