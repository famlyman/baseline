import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RoleIntroductionScreen = () => {
  const router = useRouter();

  const handlePlayerSelect = () => {
    router.push('/SignUp'); // Navigate directly to Sign Up for players
  };

  const handleCoordinatorSelect = () => {
    router.push('/CreateTenant'); // Navigate to a screen for creating a new tenant
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Are you a player or coordinator?</Text>
      <TouchableOpacity style={styles.roleCard} onPress={handlePlayerSelect}>
        <Text style={styles.roleTitle}>Player</Text>
        <Text style={styles.roleDescription}>Join leagues, play ladders, track your matches.</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.roleCard} onPress={handleCoordinatorSelect}>
        <Text style={styles.roleTitle}>Coordinator</Text>
        <Text style={styles.roleDescription}>Manage seasons, leagues, and players.</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1E3A8A', // Navy blue
  },
  roleDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});

export default RoleIntroductionScreen;