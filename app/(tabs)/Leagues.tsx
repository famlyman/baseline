import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useLeagueContext } from '../../context/LeagueContext';

// Define the League interface (it's good to keep it consistent)
interface League {
  id: string;
  name: string;
  type: string;
}

const LeaguesScreen = () => {
  const { leagues } = useLeagueContext();

  const renderItem = ({ item }: { item: League }) => (
    <View style={styles.listItem}>
      <Text style={styles.leagueName}>{item.name}</Text>
      <Text style={styles.leagueType}>({item.type})</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Leagues</Text>
      <FlatList
        data={leagues}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
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
  listItem: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  leagueType: {
    fontSize: 16,
    color: 'gray',
  },
});

export default LeaguesScreen;