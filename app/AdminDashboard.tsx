import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { League, useLeagueContext } from '../context/LeagueContext';

const AdminDashboard = () => {
  const router = useRouter();
  const { joinCode } = useLocalSearchParams();
  const [newLeagueName, setNewLeagueName] = useState('');
  const { leagues, addLeague } = useLeagueContext(); // Get the leagues array from the context

  const handleCreateLeague = () => {
    if (newLeagueName) {
      addLeague({ name: newLeagueName, type: 'Singles' });
      setNewLeagueName('');
      alert(`League "${newLeagueName}" created!`);
    } else {
      alert('Please enter a league name.');
    }
  };

  const renderLeagueItem = ({ item }: { item: League }) => (
    <View style={styles.listItem}>
      <Text style={styles.leagueName}>{item.name} ({item.type})</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      {joinCode && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Your Private Tenant Join Code:</Text>
          <Text style={styles.codeText}>{joinCode}</Text>
          <Text style={styles.infoText}>Share this code with players to join.</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create New League</Text>
        <TextInput
          style={styles.input}
          placeholder="League Name"
          value={newLeagueName}
          onChangeText={setNewLeagueName}
        />
        <TouchableOpacity style={styles.createButton} onPress={handleCreateLeague}>
          <Text style={styles.buttonText}>Create League</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Created Leagues</Text>
        {leagues.length === 0 ? (
          <Text>No leagues created yet.</Text>
        ) : (
          <FlatList
            data={leagues}
            keyExtractor={(item) => item.id}
            renderItem={renderLeagueItem}
          />
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => console.log('Navigate to Ladders')}>
        <Text style={styles.buttonText}>Ladders (Placeholder)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => console.log('Navigate to Players')}>
        <Text style={styles.buttonText}>Players (Placeholder)</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#e0f7fa',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
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
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  listItem: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  leagueName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminDashboard;