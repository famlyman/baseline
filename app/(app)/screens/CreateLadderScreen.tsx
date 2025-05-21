import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const CreateLadderScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Ladder</Text>
      <Text>Form to create a new ladder will go here.</Text>
      {/* Your form fields for ladder creation */}
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

export default CreateLadderScreen;