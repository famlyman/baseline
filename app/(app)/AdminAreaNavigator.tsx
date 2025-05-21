// app/(app)/AdminAreaNavigator.tsx

import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router'; // Correct way to import router for navigation
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';

// Import your new screens
import AdminDashboardHome from './screens/AdminDashboardHome';
import CreateLadderScreen from './screens/CreateLadderScreen';
import CreateMatchScreen from './screens/CreateMatchScreen';
import CreateLeagueScreen from './screens/CreateLeagueScreen';

import supabase from '../../utils/supabaseClient'; // Adjust path to supabaseClient

const Drawer = createDrawerNavigator();

// Custom Drawer Content to add extra items like "Back to Home" and Logout
const CustomDrawerContent = (props: any) => {
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await supabase.auth.signOut();
            // Navigate to the root (login/home) after logout
            router.replace('/');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerHeaderText}>Admin Panel</Text>
      </View>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
        {/* Add a button to navigate back to the main app's home screen */}
        <DrawerItem
          label="Back to User Home"
          onPress={() => router.replace('../../(tabs)/Home')} // Navigate to the main user home
          icon={({ color, size }) => (
            // You can add an icon here if you have an icon library setup
            <Text style={{ color, fontSize: size }}>🏠</Text>
          )}
        />
        <DrawerItem
          label="Logout"
          onPress={handleLogout}
          icon={({ color, size }) => (
            // You can add an icon here
            <Text style={{ color, fontSize: size }}>➡️</Text>
          )}
        />
      </DrawerContentScrollView>
    </SafeAreaView>
  );
};

const AdminAreaNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="AdminDashboardHome"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1E3A8A', // Custom header background
        },
        headerTintColor: '#fff', // Custom header text color
        drawerActiveTintColor: '#1E3A8A', // Active item text color in drawer
        drawerInactiveTintColor: '#333', // Inactive item text color in drawer
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // Remove default header left button (hamburger) if you want custom one
        // headerLeft: () => null,
      }}
    >
      <Drawer.Screen
        name="AdminDashboardHome"
        component={AdminDashboardHome}
        options={{ title: 'Admin Dashboard' }}
      />
      <Drawer.Screen
        name="CreateLeagueScreen"
        component={CreateLeagueScreen}
        options={{ title: 'Create League' }}
      />
      <Drawer.Screen
        name="CreateLadderScreen"
        component={CreateLadderScreen}
        options={{ title: 'Create Ladder' }}
      />
      <Drawer.Screen
        name="CreateMatchScreen"
        component={CreateMatchScreen}
        options={{ title: 'Create Match' }}
      />
      {/* Add more admin screens here */}
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    backgroundColor: '#1E3A8A',
    marginBottom: 10,
  },
  drawerHeaderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default AdminAreaNavigator;