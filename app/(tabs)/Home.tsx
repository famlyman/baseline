import { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Import SafeAreaView
import supabase from '../../utils/supabaseClient'; // Adjust path if necessary

// Define types for Division and PlayerStanding based on YOUR DIVISIONS SCHEMA
interface Division {
  id: string;
  name: string;
  league_id: string; // This links to the parent League
  tenant_id: string;
  type: 'Singles' | 'Doubles' | 'Mixed'; // Add this
  gender: 'Men\'s' | 'Women\'s' | null; // Add this, use null for Mixed or general types
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
  // New state for the selected filter type
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Men\'s' | 'Women\'s' | 'Mixed'>('All');


  const fetchSessionAndStandings = useCallback(async () => {
    setLoading(true); // <--- These were the missing state setters
    setError(null); // <--- These were the missing state setters
    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !currentSession || !currentSession.user) {
        Alert.alert('Authentication Required', 'Please log in.');
        router.replace('/'); // <--- router was not in scope
        return;
      }
      setSession(currentSession); // <--- setSession was not in scope

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
        .select('id, name, league_id, tenant_id, type, gender') // ADD type and gender here
        .eq('tenant_id', userTenantId)
        // You might want to add a filter here for 'status' if divisions have a status
        // .eq('status', 'active'); // Example: only fetch 'active' divisions

      if (divisionsError) {
        throw new Error(divisionsError.message);
      }

      setActiveDivisions(divisionsData || []); // <--- setActiveDivisions was not in scope

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
      setError(`Failed to load standings: ${err.message}`); // <--- setError was not in scope
      if (err.message.includes('Authentication') || err.message.includes('User not authenticated')) {
        supabase.auth.signOut();
        router.replace('/'); // <--- router was not in scope
      }
    } finally {
      setLoading(false); // <--- setLoading was not in scope
    }
  }, [router]); // Dependencies are correct: router

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

  // Filtered divisions based on selectedFilter
  const filteredDivisions = activeDivisions.filter(division => { // <--- activeDivisions was not in scope, 'division' implicitly any type fix
    if (selectedFilter === 'All') {
      return true;
    }
    if (selectedFilter === 'Mixed') {
      return division.type === 'Mixed';
    }
    if (selectedFilter === 'Men\'s') {
      return division.gender === 'Men\'s' && (division.type === 'Singles' || division.type === 'Doubles');
    }
    if (selectedFilter === 'Women\'s') {
      return division.gender === 'Women\'s' && (division.type === 'Singles' || division.type === 'Doubles');
    }
    return false;
  });

  if (loading) { // <--- loading was not in scope
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading your active divisions and standings...</Text>
      </View>
    );
  }

  if (!session) { // <--- session was not in scope
    return null; // Or a login prompt
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Home</Text>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {['All', 'Men\'s', 'Women\'s', 'Mixed'].map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                selectedFilter === filterType && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filterType as 'All' | 'Men\'s' | 'Women\'s' | 'Mixed')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filterType && styles.filterButtonTextActive,
              ]}>
                {filterType}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredDivisions.length > 0 ? (
          <FlatList
            data={filteredDivisions}
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
            <Text style={styles.noActiveDivisionText}>No active divisions found for this filter.</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/Leagues')}>
              <Text style={styles.buttonText}>View Leagues & Divisions</Text>
            </TouchableOpacity>
          </View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loadingContainer: { // Original style
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: { // Original style
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: { // Original style
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: { // Original style
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  header: { // Original style
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  divisionCard: { // Original style
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
  divisionTitle: { // Original style
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1E3A8A',
    textAlign: 'center',
  },
  standingItem: { // Original style
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rank: { // Original style
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
  },
  playerName: { // Original style
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  score: { // Original style
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  standingSeparator: { // Original style
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },
  divisionSeparator: { // Original style
    height: 10, // More space between division cards
  },
  noDataText: { // Original style
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
  },
  noActiveDivisionContainer: { // Original style
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noActiveDivisionText: { // Original style
    fontSize: 18,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: { // Original style
    backgroundColor: '#1E3A8A',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  buttonText: { // Original style
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },

  // New styles for filter buttons
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    padding: 5,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  filterButtonActive: {
    backgroundColor: '#1E3A8A', // Active button background
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  filterButtonTextActive: {
    color: '#FFFFFF', // Active button text color
  },
});

export default Home;