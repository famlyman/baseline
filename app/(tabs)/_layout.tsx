import { FontAwesome5 } from '@expo/vector-icons'; // Assuming you use this for icons
import { Tabs } from 'expo-router';

const TabbedLayout = () => {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome5 name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Leagues" // This is your Leagues.tsx, displaying top-level leagues
        options={{
          title: 'Leagues',
          tabBarIcon: ({ color }) => <FontAwesome5 name="trophy" size={24} color={color} />, // Example icon
        }}
      />
      <Tabs.Screen
        name="leagues/[id]"
        options={{
          title: 'League Details',
          headerShown: true,
          tabBarButton: () => null, // Hide this from the tab bar itself, it's navigated to
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome5 name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
};

export default TabbedLayout;
