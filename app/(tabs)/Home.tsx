import { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import supabase from '../../utils/supabaseClient'; // Adjust path if necessary

// Define types for Division and PlayerStanding based on YOUR DIVISIONS SCHEMA
// Ensure 'status' column is present in your 'divisions' table.
interface Division {
  id: string;
  name: string;
  league_id: string; // This links to the parent League
  tenant_id: string;
  // Add other columns from your 'divisions' table if you need them
}

interface PlayerStanding {
  player_id: string;
  player_name: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  rank?: number; // Optional, if you calculate rank in frontend or RPC
}

const Home = () => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDivisions, setActiveDivisions] = useState<Division[]>([]); // To store active divisions
  const [standingsByDivision, setStandingsByDivision] = useState<{ [divisionId: string]: PlayerStanding[] }>({});

  const fetchSessionAndStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !currentSession || !currentSession.user) {
        Alert.alert('Authentication Required', 'Please log in.');
        router.replace('/');
        return;
      }
      setSession(currentSession);

      const { data: userData, error: userProfileError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', currentSession.user.id)
        .maybeSingle();

      if (userProfileError) {
        throw new Error(userProfileError.message);
      }
      if (!userData || !userData.tenant_id) {
        throw new Error('User profile or tenant ID not found. Cannot fetch standings.');
      }

      const userTenantId = userData.tenant_id;

      // 1. Fetch all active divisions for the user's tenant
      const { data: divisionsData, error: divisionsError } = await supabase
        .from('divisions') // <-- Query 'divisions' table
        .select('id, name, league_id, tenant_id') // Ensure 'status' column exists in 'divisions'
        .eq('tenant_id', userTenantId)

      if (divisionsError) {
        throw new Error(divisionsError.message);
      }

      setActiveDivisions(divisionsData || []);

      // 2. Fetch standings for each active division
      const newStandings: { [divisionId: string]: PlayerStanding[] } = {};
      for (const division of divisionsData || []) {
        const { data: standingsData, error: standingsError } = await supabase.rpc('get_division_standings', {
          p_division_id: division.id, // Parameter should match what your RPC expects
        });

        if (standingsError) {
          console.error(`Error fetching standings for division ${division.name}:`, standingsError.message);
          // Optionally, skip this division or show a specific error
        } else {
          newStandings[division.id] = standingsData || [];
        }
      }
      setStandingsByDivision(newStandings);

    } catch (err: any) {
      console.error('Error in fetchSessionAndStandings:', err);
      setError(`Failed to load standings: ${err.message}`);
      if (err.message.includes('Authentication') || err.message.includes('User not authenticated')) {
        supabase.auth.signOut();
        router.replace('/');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSessionAndStandings();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession || _event === 'SIGNED_OUT') {
        fetchSessionAndStandings();
      }
    });

    // Realtime subscription for 'divisions' table changes
    const divisionsChannel = supabase
      .channel('public:divisions') // <-- Listen to 'divisions' table
      .on('postgres_changes', { event: '*', schema: 'public', table: 'divisions' }, (payload) => {
        console.log('Division change detected:', payload);
        fetchSessionAndStandings(); // Re-fetch on any relevant change
      })
      .subscribe();


    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(divisionsChannel);
    };
  }, [fetchSessionAndStandings]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading your active divisions and standings...</Text>
      </View>
    );
  }

  if (!session) {
    return null; // Or a login prompt
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Home</Text>
      {activeDivisions.length > 0 ? (
        <FlatList
          data={activeDivisions}
          keyExtractor={(item) => item.id}
          renderItem={({ item: division }) => (
            <View style={styles.divisionCard}>
              <Text style={styles.divisionTitle}>{division.name} Standings</Text>
              {standingsByDivision[division.id] && standingsByDivision[division.id].length > 0 ? (
                <FlatList
                  data={standingsByDivision[division.id]}
                  keyExtractor={(standingItem) => standingItem.player_id}
                  renderItem={({ item: standing, index }) => (
                    <View style={styles.standingItem}>
                      <Text style={styles.rank}>{index + 1}.</Text>
                      <Text style={styles.playerName}>{standing.player_name}</Text>
                      <Text style={styles.score}>W:{standing.wins} L:{standing.losses} D:{standing.draws} Pts:{standing.points}</Text>
                    </View>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.standingSeparator} />}
                />
              ) : (
                <Text style={styles.noDataText}>No standings available yet for {division.name}. Start playing!</Text>
              )}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.divisionSeparator} />}
        />
      ) : (
        <View style={styles.noActiveDivisionContainer}>
            <Text style={styles.noActiveDivisionText}>No active divisions found for your tenant.</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/Leagues')}>
                <Text style={styles.buttonText}>View Leagues & Divisions</Text>
            </TouchableOpacity>
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  divisionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  divisionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1E3A8A',
    textAlign: 'center',
  },
  standingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  score: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  standingSeparator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },
  divisionSeparator: {
    height: 10, // More space between division cards
  },
  noDataText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
  },
  noActiveDivisionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  noActiveDivisionText: {
      fontSize: 18,
      color: '#777',
      textAlign: 'center',
      marginBottom: 20,
  },
  button: {
    backgroundColor: '#1E3A8A',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default Home;