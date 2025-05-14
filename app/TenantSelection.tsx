import { Picker } from '@react-native-picker/picker'; // Import the dropdown component
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Placeholder data for public tenants
const publicTenants = [
  { id: 'balboa', name: 'Balboa Tennis Club' },
  { id: 'citypark', name: 'City Park Courts' },
  { id: 'riverside', name: 'Riverside Tennis Association' },
];

const TenantSelectionScreen = () => {
  const router = useRouter();
  const [selectedPublicTenant, setSelectedPublicTenant] = React.useState<string | undefined>(undefined); // Changed to undefined
  const [privateCode, setPrivateCode] = React.useState('');

  const handleJoinPublicTenant = () => {
    if (selectedPublicTenant) {
      console.log(`Joining public tenant: ${selectedPublicTenant}`);
      // In a real app, you'd proceed to sign-up/login for this tenant
      router.push(`/SignUp?tenantId=${selectedPublicTenant}&role=player`);
    } else {
      alert('Please select a public tenant.');
    }
  };

  const handleJoinPrivateTenant = () => {
    if (privateCode) {
      console.log(`Attempting to join private tenant with code: ${privateCode}`);
      // In a real app, you'd need to validate this code against your backend
      router.push(`/SignUp?privateCode=${privateCode}&role=player`);
    } else {
      alert('Please enter the private tenant code.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Tenant</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Public Tenants</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedPublicTenant}
            onValueChange={(itemValue, itemIndex) => setSelectedPublicTenant(itemValue)}
          >
            <Picker.Item label="Select a club or municipality" value={undefined} /> {/* Keep the value as undefined for the default item */}
            {publicTenants.map((tenant) => (
              <Picker.Item key={tenant.id} label={tenant.name} value={tenant.id} />
            ))}
          </Picker>
        </View>
        <TouchableOpacity style={styles.joinButton} onPress={handleJoinPublicTenant}>
          <Text style={styles.buttonText}>Join Public Tenant</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Join Private Tenant</Text>
        <TextInput
          style={styles.privateCodeInput}
          placeholder="Enter join code"
          value={privateCode}
          onChangeText={setPrivateCode}
        />
        <TouchableOpacity style={styles.joinButton} onPress={handleJoinPrivateTenant}>
          <Text style={styles.buttonText}>Join Private Tenant</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 30,
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
  privateCodeInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  joinButton: {
    backgroundColor: '#2E7D32', // Tennis Green
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TenantSelectionScreen;