import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import supabase from '../../utils/supabaseClient';

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        console.log("Session user ID on load:", session.user.id); // Added logging
        // Query the users table for the role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error("Error fetching user data on session check:", userError);
          return;
        }
        
        if (userData?.role) {
          const role = userData.role;
          if (role === 'coordinator') {
            router.replace('/AdminDashboard');
          } else {
            router.replace('/(tabs)/Home');
          }
        }
      }
    }
    checkSession();
  }, [])

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        console.error('Error signing in:', signInError);
        setLoading(false);
        return;
      }

      if (data?.user?.id) {
        console.log("Logged in user ID:", data.user.id); // Added logging
        // Query the users table to get the role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          setError('Error fetching user information');
          console.error('Error fetching user data:', userError);
          setLoading(false);
          return;
        }

        if (userData?.role) {
          const role = userData.role;
          console.log('Login successful. Role:', role, data);
          if (role === 'coordinator') {
            router.replace('../(app)/AdminAreaNavigator');
          } else {
            router.replace('/(tabs)/Home');
          }
        } else {
          setError("Role information is missing. Please contact support.");
          console.error("Role information is missing from user_roles", data);
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error('Unexpected error during login:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Log In</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!loading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password:</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          editable={!loading}
        />
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Log In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/SignUp')}
        style={styles.signUpLink}
      >
        <Text style={styles.signUpText}>
          Don't have an account? Sign Up
        </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  loginButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  signUpLink: {
    marginTop: 15,
  },
  signUpText: {
    color: '#007bff',
    textDecorationLine: 'underline',
  }
});

export default LoginScreen;