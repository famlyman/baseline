import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTenantContext } from '../context/TenantContext'; // Import useTenantContext

const CreateTenantScreen = () => {
  const router = useRouter();
  const { addTenant } = useTenantContext(); // Get the addTenant function
  const [tenantName, setTenantName] = React.useState('');
  const [privateJoinCode, setPrivateJoinCode] = React.useState('');
  const [coordinatorEmail, setCoordinatorEmail] = React.useState('');
  const [coordinatorPassword, setCoordinatorPassword] = React.useState('');
  const [coordinatorFirstName, setCoordinatorFirstName] = useState('');
  const [coordinatorLastName, setCoordinatorLastName] = useState('');
  const [isPrivateTenant, setIsPrivateTenant] = React.useState(false);
  const [generatedJoinCode, setGeneratedJoinCode] = React.useState<string | null>(null);

  const handleCreateTenantAndUser = async () => {
    if (tenantName && coordinatorEmail && coordinatorPassword) {
      let newCode = null;
      if (isPrivateTenant) {
        newCode = Math.random().toString(36).substring(7).toUpperCase();
        setGeneratedJoinCode(newCode);
      }

      // Add the new tenant to the global state
      addTenant({
        name: tenantName,
        isPrivate: isPrivateTenant,
        joinCode: newCode,
        coordinatorEmail: coordinatorEmail,
        coordinatorFirstName: coordinatorFirstName,
        coordinatorLastName: coordinatorLastName,
      });
      console.log('Tenant data being added:', { tenantName, isPrivateTenant, newCode });

      // Simulate backend call and navigate
      setTimeout(() => {
        router.push({
          pathname: '/AdminDashboard',
          params: { joinCode: newCode },
        });
      }, 1000);
    } else {
      alert('Please enter a tenant name, your email, and a password.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Tenant & Coordinator Account</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Tenant Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Balboa Tennis Club"
          value={tenantName}
          onChangeText={setTenantName}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.label}>Private Tenant?</Text>
        <Switch
          value={isPrivateTenant}
          onValueChange={setIsPrivateTenant}
        />
      </View>

      {/* We no longer need to display the join code here */}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Email:</Text>
        <TextInput
          style={styles.input}
          placeholder="your.email@example.com"
          value={coordinatorEmail}
          onChangeText={setCoordinatorEmail}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Password:</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          value={coordinatorPassword}
          onChangeText={setCoordinatorPassword}
          secureTextEntry={true}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your First Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="John"
          value={coordinatorFirstName}
          onChangeText={setCoordinatorFirstName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Last Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="Doe"
          value={coordinatorLastName}
          onChangeText={setCoordinatorLastName}
        />
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCreateTenantAndUser}>
        <Text style={styles.buttonText}>Create Tenant & Sign Up</Text>
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
  infoBox: {
    backgroundColor: '#e0f7fa',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  codeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});

export default CreateTenantScreen;