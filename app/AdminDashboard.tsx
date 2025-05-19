import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CreateSeasonForm from '../components/CreateSeasonForm'; // Adjust the path as needed
import supabase from '../utils/supabaseClient';

const AdminDashboardScreen = () => {
  const [isCreatingSeason, setIsCreatingSeason] = useState(false);
  const [seasons, setSeasons] = useState<any[]>([]); // Adjust the type as needed
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [errorLoadingSeasons, setErrorLoadingSeasons] = useState<string | null>(null);

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    setLoadingSeasons(true);
    setErrorLoadingSeasons(null);
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        setErrorLoadingSeasons(error.message);
        console.error('Error fetching seasons:', error);
      } else if (data) {
        setSeasons(data);
      }
    } catch (error: any) {
      setErrorLoadingSeasons(error.message);
      console.error('Unexpected error fetching seasons:', error);
    } finally {
      setLoadingSeasons(false);
    }
  };

  const handleCreateSeason = async (seasonData: { name: string; start_date: string | undefined; end_date: string | undefined }) => {
    setIsCreatingSeason(false); // Close the form
    setLoadingSeasons(true); // Indicate loading during creation
    setErrorLoadingSeasons(null);
    try {
      const { data, error } = await supabase
        .from('seasons')
        .insert([seasonData])
        .select(); // Get the newly created season

      if (error) {
        setErrorLoadingSeasons(error.message);
        console.error('Error creating season:', error);
        alert(`Error creating season: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log('Season created successfully:', data[0]);
        setSeasons((prevSeasons) => [data[0], ...prevSeasons]); // Add the new season to the list
        alert('Season created successfully!');
      }
    } catch (error: any) {
      setErrorLoadingSeasons(error.message);
      console.error('Unexpected error creating season:', error);
      alert(`Unexpected error creating season: ${error.message}`);
    } finally {
      setLoadingSeasons(false);
    }
  };

  const handleCancelCreateSeason = () => {
    setIsCreatingSeason(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard - Seasons</Text>

      <TouchableOpacity style={styles.createButton} onPress={() => setIsCreatingSeason(true)}>
        <Text style={styles.buttonText}>Create New Season</Text>
      </TouchableOpacity>

      {isCreatingSeason && (
        <CreateSeasonForm onCreateSeason={handleCreateSeason} onCancel={handleCancelCreateSeason} />
      )}

      <Text style={styles.subtitle}>Existing Seasons</Text>
      {loadingSeasons ? (
        <Text>Loading seasons...</Text>
      ) : errorLoadingSeasons ? (
        <Text style={styles.error}>{errorLoadingSeasons}</Text>
      ) : (
        <FlatList
          data={seasons}
          keyExtractor={(item) => item.id.toString()} // Assuming your seasons table has an 'id' column
          renderItem={({ item }) => (
            <View style={styles.seasonItem}>
              <Text style={styles.seasonName}>{item.name}</Text>
              <Text>Start Date: {item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A'}</Text>
              <Text>End Date: {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A'}</Text>
            </View>
          )}
        />
      )}
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
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#1E3A8A',
  },
  createButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  seasonItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  seasonName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default AdminDashboardScreen;