import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import supabase from '../../utils/supabaseClient';

const ProfileScreen = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Authentication error:', authError);
          setError('Authentication error. Please log in again.');
          await supabase.auth.signOut();
          router.replace('/(auth)/Login');
          return;
        }
        
        if (!user) {
          setError('No user found. Please log in.');
          router.replace('/(auth)/Login');
          return;
        }

        // Fetch user data including role from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (userError) {
          console.error('Error fetching user data:', userError);
          setError('Error loading user information');
          return;
        }
        
        if (userData?.role) {
          setUserRole(userData.role);
        } else {
          console.log('No role found for user, defaulting to player');
          setUserRole('player'); // Set a default role if none found
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const handleAdminDashboard = () => {
    router.push('../(app)/AdminAreaNavigator');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      // Handle logout error (e.g., display a message)
    } else {
      router.push('/'); // Navigate back to the login/home screen
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={[styles.button, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Screen</Text>

      {userRole === 'coordinator' && (
        <TouchableOpacity 
          style={[styles.button, styles.adminButton]} 
          onPress={handleAdminDashboard}
        >
          <Text style={styles.buttonText}>Admin Dashboard</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        style={[styles.button, styles.logoutButton]} 
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  adminButton: {
    backgroundColor: '#28a745',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default ProfileScreen;