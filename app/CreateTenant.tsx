import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import supabase from '../utils/supabaseClient';

const CreateTenantScreen = () => {
  const router = useRouter();
  const [tenantName, setTenantName] = useState('');
  const [isPrivateTenant, setIsPrivateTenant] = useState(false);
  const [coordinatorEmail, setCoordinatorEmail] = useState('');
  const [coordinatorPassword, setCoordinatorPassword] = useState('');
  const [coordinatorFirstName, setCoordinatorFirstName] = useState('');
  const [coordinatorLastName, setCoordinatorLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTenantAndUser = async () => {
    if (!tenantName || !coordinatorEmail || !coordinatorPassword || !coordinatorFirstName || !coordinatorLastName) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Tenant Name, Email, Password, First Name, Last Name).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: coordinatorEmail,
        password: coordinatorPassword,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const user = authData?.user;
      if (!user) {
        setError('User not returned after signup. Authentication might be pending.');
        setLoading(false);
        return;
      }

      const { data: newTenantId, error: rpcError } = await supabase.rpc('create_new_tenant_and_user_profile', {
        tenant_name: tenantName,
        user_email: user.email!,
        user_first_name: coordinatorFirstName,
        user_last_name: coordinatorLastName,
        user_role: 'coordinator',
      });

      if (rpcError) {
        console.error('Error creating tenant and user profile via RPC:', rpcError);
        setError(`Failed to set up account: ${rpcError.message}`);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!newTenantId) {
        setError('Tenant ID was not returned by the backend function.');
        setLoading(false);
        return;
      }

      console.log('Tenant and Coordinator profile created successfully! New Tenant ID:', newTenantId);
      Alert.alert('Success', 'Tenant and Coordinator account created successfully!');
      router.replace('/(app)/AdminAreaNavigator');

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during account creation.');
      console.error('Unhandled error during account creation:', err);
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
        <Text style={styles.title}>Create New Tenant & Coordinator Account</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tenant Name:</Text>
          <TextInput 
            style={styles.input} 
            value={tenantName} 
            onChangeText={setTenantName} 
            placeholder="Tenant Name" 
          />
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.label}>Private Tenant?</Text>
          <Switch value={isPrivateTenant} onValueChange={setIsPrivateTenant} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Email:</Text>
          <TextInput 
            style={styles.input} 
            value={coordinatorEmail} 
            onChangeText={setCoordinatorEmail} 
            placeholder="Email" 
            keyboardType="email-address" 
            autoCapitalize="none" 
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Password:</Text>
          <TextInput 
            style={styles.input} 
            value={coordinatorPassword} 
            onChangeText={setCoordinatorPassword} 
            placeholder="Password" 
            secureTextEntry={true} 
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your First Name:</Text>
          <TextInput 
            style={styles.input} 
            value={coordinatorFirstName} 
            onChangeText={setCoordinatorFirstName} 
            placeholder="First Name" 
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Last Name:</Text>
          <TextInput 
            style={styles.input} 
            value={coordinatorLastName} 
            onChangeText={setCoordinatorLastName} 
            placeholder="Last Name" 
          />
        </View>

        <TouchableOpacity 
          style={styles.createButton} 
          onPress={handleCreateTenantAndUser} 
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Create Tenant & Sign Up'}
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
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
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
  createButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },
});

export default CreateTenantScreen;
