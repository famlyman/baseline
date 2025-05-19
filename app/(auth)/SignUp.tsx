import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import supabase from '../../utils/supabaseClient';

const SignUpScreen = () => {
  const router = useRouter();
  const { tenantId, privateCode } = useLocalSearchParams();
  const [publicTenants, setPublicTenants] = useState<{ id: string; name: string }[]>([]);
  const [selectedPublicTenant, setSelectedPublicTenant] = useState<string | undefined>(tenantId as string | undefined);
  const [enteredPrivateCode, setEnteredPrivateCode] = useState<string | undefined>(privateCode as string | undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'player' | 'coordinator'>('player');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicTenants = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, name')
          .eq('is_private', false);

        if (error) {
          setError(error.message);
          console.error('Error fetching public tenants:', error);
        } else if (data) {
          setPublicTenants(data);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Unexpected error fetching public tenants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicTenants();
  }, []);

  const handleSignUp = async () => {
    const tenantInfo = selectedPublicTenant
      ? { tenantId: selectedPublicTenant }
      : enteredPrivateCode
      ? { privateCode: enteredPrivateCode }
      : {};

    console.log('Signing up with:', {
      ...tenantInfo,
      email,
      password,
      firstName,
      lastName,
      role,
    });

    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName,
            role,
            ...tenantInfo,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        console.error('Error signing up:', authError);
      } else {
        console.log('Sign up authData:', authData);
        if (authData?.user?.id) {
          console.log('User ID from auth (SignUp):', authData.user.id);
          console.log('Role to be inserted (SignUp):', role);
          // Insert role into the user_roles table
          const { data: roleInsertData, error: roleError } = await supabase
            .from('user_roles')
            .insert({ user_id: authData.user.id, role })
            .select(); // Add .select() to log the inserted data
  
          console.log('Role insert response (SignUp):', roleInsertData); // Log the response
  
          if (roleError) {
            setError(roleError.message);
            console.error('Error inserting role (SignUp):', roleError);
            await supabase.auth.signOut();
          } else {
            console.log('Role inserted successfully (SignUp) for user:', authData.user.id, 'Role:', role);
            router.replace('/(tabs)/Home');
          }
        } else {
          console.log('authData.user.id is undefined after signup (SignUp).');
        }
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Unexpected error during sign up:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View><Text>Loading public tenant list...</Text></View>;
  }

  if (error) {
    return <View><Text style={styles.error}>Error loading tenants: {error}</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up as Player</Text> {/* Changed title */}
  
      {/* Removed the roleButtons View and its children */}
  
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Public Tenant (Optional)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedPublicTenant}
            onValueChange={(itemValue) => setSelectedPublicTenant(itemValue)}
            enabled={!loading}
          >
            <Picker.Item label="Select a club or municipality" value={undefined} />
            {publicTenants.map((tenant) => (
              <Picker.Item key={tenant.id} label={tenant.name} value={tenant.id} />
            ))}
          </Picker>
        </View>
      </View>
  
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Join Private Tenant (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter join code"
          value={enteredPrivateCode}
          onChangeText={setEnteredPrivateCode}
          editable={!loading}
        />
      </View>
  
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
  
      <View style={styles.inputContainer}>
        <Text style={styles.label}>First Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          editable={!loading}
        />
      </View>
  
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Last Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          editable={!loading}
        />
      </View>
  
      <TouchableOpacity
        style={styles.signUpButton}
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
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
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1E3A8A',
  },
  pickerContainer: {
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 15,
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
  signUpButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
    backgroundColor: '#ddd',
  },
  selectedRoleButton: {
    backgroundColor: '#2E7D32',
  },
  roleButtonText: {
    color: '#333',
  },
  selectedRoleButtonText: {
    color: '#fff',
  },
});

export default SignUpScreen;