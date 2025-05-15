import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTenantContext } from '../context/TenantContext';

const TenantSelectionScreen = () => {
  console.log('TenantSelectionScreen rendered');
  const router = useRouter();
  const { tenants } = useTenantContext();
  console.log('Available tenants in TenantSelection:', tenants);
  const [selectedPublicTenantId, setSelectedPublicTenantId] = React.useState<string | undefined>(undefined);
  const [privateCode, setPrivateCode] = React.useState('');

  const publicTenants = tenants.filter(tenant => tenant.joinCode === null);

  useEffect(() => {
    console.log('TenantSelectionScreen mounted. Current tenants:', tenants);
  }, []);

  const handleJoinPublicTenant = () => {
    if (selectedPublicTenantId) {
      console.log(`Joining public tenant ID: ${selectedPublicTenantId}`);
      router.push(`/SignUp?tenantId=${selectedPublicTenantId}&role=player`);
    } else {
      alert('Please select a public tenant.');
    }
  };

  const handleJoinPrivateTenant = () => {
    if (privateCode) {
      const foundTenant = tenants.find(tenant => tenant.joinCode?.toUpperCase() === privateCode.toUpperCase());
      if (foundTenant) {
        console.log(`Attempting to join private tenant with ID: ${foundTenant.id}`);
        router.push(`/SignUp?tenantId=${foundTenant.id}&role=player`);
      } else {
        alert('Invalid private tenant code.');
      }
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
            selectedValue={selectedPublicTenantId}
            onValueChange={(itemValue) => setSelectedPublicTenantId(itemValue)}
          >
            <Picker.Item label="Select a club or municipality" value={undefined} />
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