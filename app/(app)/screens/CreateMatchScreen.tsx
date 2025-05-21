import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const CreateMatchScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Match</Text>
      <Text>Form to create a new match will go here.</Text>
      {/* Your form fields for match creation */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default CreateMatchScreen;