import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView, // Import KeyboardAvoidingView
  Platform // Import Platform
  ,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
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
  const [ratings, setRatings] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicTenants = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('tenants')
          .select('id, name')
          .eq('is_private', false);

        if (fetchError) {
          setError(fetchError.message);
          console.error('Error fetching public tenants:', fetchError);
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
    // --- Input Validation ---
    if (!email || !password || !firstName || !lastName || gender === null) {
      Alert.alert('Missing Information', 'Please fill in all required fields: Email, Password, First Name, Last Name, and Gender.');
      return;
    }
    if (selectedPublicTenant && enteredPrivateCode) {
      Alert.alert('Tenant Selection Conflict', 'Please select either a public tenant OR enter a private code, not both.');
      return;
    }

    const parsedRatings = parseFloat(ratings);
    const finalRatings = isNaN(parsedRatings) ? null : parsedRatings;

    const tenantInfo = selectedPublicTenant
      ? { tenant_id: selectedPublicTenant }
      : {};

    console.log('Attempting sign up with:', {
      ...tenantInfo,
      email,
      password,
      firstName,
      lastName,
      role,
      ratings: finalRatings,
      gender,
    });

    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
            ratings: finalRatings,
            gender: gender,
            ...tenantInfo,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        console.error('Error signing up with Supabase Auth:', authError);
        Alert.alert('Sign Up Error', authError.message);
      } else if (authData?.user?.id) {
        console.log('User signed up successfully with Auth. Now inserting profile into public.users table...');

        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            first_name: firstName,
            last_name: lastName,
            role: role,
            ratings: finalRatings,
            gender: gender,
            ...tenantInfo,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Error inserting user profile into public.users:', profileError);
          setError('Error completing registration. Please contact support.');
          Alert.alert('Registration Error', 'Failed to save user profile. Please try again or contact support.');
          await supabase.auth.signOut();
        } else {
          console.log('User profile successfully inserted with role:', role);
          router.replace('/(tabs)/Home');
        }
      } else {
        console.error('Unexpected error: No user data or user ID returned after signup.');
        setError('An unexpected error occurred during signup. Please try again.');
        Alert.alert('Unexpected Error', 'An issue occurred during sign up. Please try again.');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Unexpected error during sign up:', err);
      Alert.alert('Error', 'An unexpected error occurred: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && publicTenants.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading public tenant list...</Text>
      </View>
    );
  }

  if (error && publicTenants.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading tenants: {error}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer} // This style should have flex: 1
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // 'padding' for iOS, 'height' for Android
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Adjust this offset if needed
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
        <Text style={styles.title}>Sign Up as Player</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Public Tenant (Optional)</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedPublicTenant}
              onValueChange={(itemValue) => setSelectedPublicTenant(itemValue as string | undefined)}
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
            editable={!loading && !selectedPublicTenant}
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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Rating (Decimal, e.g., 2.5):</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your rating (e.g., 2.5)"
            value={ratings}
            onChangeText={(text) => {
              if (/^\d*\.?\d*$/.test(text) || text === '') {
                setRatings(text);
              }
            }}
            keyboardType="decimal-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gender:</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                gender === 'Male' && styles.selectedRadioButton,
              ]}
              onPress={() => setGender('Male')}
              disabled={loading}
            >
              <Text
                style={[
                  styles.radioText,
                  gender === 'Male' && styles.selectedRadioText,
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioButton,
                gender === 'Female' && styles.selectedRadioButton,
              ]}
              onPress={() => setGender('Female')}
              disabled={loading}
            >
              <Text
                style={[
                  styles.radioText,
                  gender === 'Female' && styles.selectedRadioText,
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: { // New style for KeyboardAvoidingView
    flex: 1, // Crucial: Makes KeyboardAvoidingView take full screen
  },
  container: { // Now applies to ScrollView
    flex: 1, // Ensures ScrollView takes full height within KAV
    backgroundColor: '#F5F5F5',
  },
  scrollContentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 150, // Keep this value high for testing, you can reduce it later
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
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
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
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
    height: 48,
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  signUpButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    marginTop: 5,
  },
  radioButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A0A0A0',
    backgroundColor: '#F0F0F0',
  },
  selectedRadioButton: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  radioText: {
    color: '#555',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedRadioText: {
    color: '#fff',
  },
});

export default SignUpScreen;