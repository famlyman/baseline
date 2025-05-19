import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import supabase from '../utils/supabaseClient'; // Import the Supabase client

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
    if (tenantName && coordinatorEmail && coordinatorPassword) {
      setLoading(true);
      setError(null);
      let newCode = null;
      if (isPrivateTenant) {
        newCode = Math.random().toString(36).substring(7).toUpperCase();
      }

      setLoading(true);
  setError(null);

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: coordinatorEmail,
      password: coordinatorPassword,
      options: {
        data: {
          firstName: coordinatorFirstName,
          lastName: coordinatorLastName,
          role: 'coordinator',
        },
      },
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    if (authData?.user?.id) {
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert([
          {
            name: tenantName,
            is_private: isPrivateTenant,
            join_code: newCode,
            coordinator_user_id: authData.user.id, // The ID from the signUp response
            coordinator_email: coordinatorEmail,
            coordinator_first_name: coordinatorFirstName,
            coordinator_last_name: coordinatorLastName,
          },
        ])
        .select('id, join_code')
        .single();

          if (tenantError) {
            // If tenant creation fails, you might want to delete the created user in Auth
            console.error('Error creating tenant:', tenantError);
            setError(tenantError.message);
            // Optionally: await supabase.auth.signOut();
          } else if (tenantData?.id) {
            console.log('Tenant created with ID:', tenantData.id, 'Join Code:', tenantData.join_code, 'Coordinator User ID:', authData.user.id);
            router.push({
              pathname: '/AdminDashboard',
              params: { joinCode: tenantData.join_code },
            });
            const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: 'coordinator' }); // Explicitly set role here

        if (roleError) {
          console.error('Error inserting coordinator role:', roleError);
          setError('Error assigning coordinator role. Please contact support.');
          // Consider deleting the user and tenant if role insertion fails
          await supabase.auth.signOut();
          await supabase.from('tenants').delete().eq('id', tenantData.id);
        }
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please fill in all required fields.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Tenant & Coordinator Account</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Tenant Name:</Text>
        <TextInput style={styles.input} value={tenantName} onChangeText={setTenantName} placeholder="Tenant Name" />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.label}>Private Tenant?</Text>
        <Switch value={isPrivateTenant} onValueChange={setIsPrivateTenant} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Email:</Text>
        <TextInput style={styles.input} value={coordinatorEmail} onChangeText={setCoordinatorEmail} placeholder="Email" keyboardType="email-address" />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Password:</Text>
        <TextInput style={styles.input} value={coordinatorPassword} onChangeText={setCoordinatorPassword} placeholder="Password" secureTextEntry={true} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your First Name:</Text>
        <TextInput style={styles.input} value={coordinatorFirstName} onChangeText={setCoordinatorFirstName} placeholder="First Name" />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Last Name:</Text>
        <TextInput style={styles.input} value={coordinatorLastName} onChangeText={setCoordinatorLastName} placeholder="Last Name" />
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCreateTenantAndUser} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Create Tenant & Sign Up'}</Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
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
    backgroundColor: '#1E3A8A', // Navy blue
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});

export default CreateTenantScreen;