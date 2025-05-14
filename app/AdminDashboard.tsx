import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AdminDashboardScreen = () => {
  const { joinCode } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      {joinCode && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Your Private Tenant Join Code:</Text>
          <Text style={styles.codeText}>{joinCode}</Text>
          <Text style={styles.infoText}>Share this code with players to join your private tenant.</Text>
          <TouchableOpacity style={styles.copyButton} onPress={() => {/* Implement copy to clipboard functionality */}}>
            <Text style={styles.copyButtonText}>Copy Code</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Add other admin dashboard content here */}
      <Text style={styles.placeholder}>Welcome to your Admin Dashboard!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#e0f7fa',
    padding: 20,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  codeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 15,
  },
  copyButton: {
    backgroundColor: '#4CAF50', // Green color for copy
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholder: {
    fontSize: 18,
    color: '#777',
  },
});

export default AdminDashboardScreen;