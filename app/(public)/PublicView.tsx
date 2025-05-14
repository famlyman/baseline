import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const PublicViewScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Public View</Text>
      <Text style={styles.info}>Browse public tenants, teams, and schedules here.</Text>
      <Text style={styles.info}>Registration required for full access.</Text>
      {/* Add public content display here later */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  info: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default PublicViewScreen;