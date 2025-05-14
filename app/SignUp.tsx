import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Placeholder data for public tenants
const publicTenants = [
  { id: 'balboa', name: 'Balboa Tennis Club' },
  { id: 'citypark', name: 'City Park Courts' },
  { id: 'riverside', name: 'Riverside Tennis Association' },
];

const SignUpScreen = () => {
  const router = useRouter();
  const [selectedPublicTenant, setSelectedPublicTenant] = React.useState<string | undefined>(undefined);
  const [privateCode, setPrivateCode] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');

  const handleSignUp = () => {
    const tenantInfo = selectedPublicTenant ? { tenantId: selectedPublicTenant } : privateCode ? { privateCode } : {};
    console.log('Signing up with:', { ...tenantInfo, email, password, firstName, lastName, role: 'player' });
    // In a real app, you'd send this data to your backend
    router.push('./(tabs)/Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up as Player</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Public Tenant (Optional)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedPublicTenant}
            onValueChange={(itemValue) => setSelectedPublicTenant(itemValue)}
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
          value={privateCode}
          onChangeText={setPrivateCode}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={styles.input}
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password:</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>First Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="John"
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Last Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="Doe"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
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
    marginBottom: 20, // Added section style
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
    marginBottom: 10, // Added pickerContainer style
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
    backgroundColor: '#2E7D32', // Tennis Green
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
});

export default SignUpScreen;