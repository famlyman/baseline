import { Session } from '@supabase/supabase-js';
import { useLocalSearchParams, useRouter } from 'expo-router'; // Import useLocalSearchParams
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import supabase from '../../../utils/supabaseClient'; // Adjusted path for (tabs)/leagues/[id] structure

interface PlayerStanding {
  player_id: string;
  player_name: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  rank?: number;
}

// Define type for Division (formerly Ladder/your old League)
interface Division {
  id: string;
  name: string;
  league_id: string; // Now refers to the new 'leagues' table
  tenant_id: string;
  created_at: string;
  type: string;
  rating_system: string;
  ruleset: any;
  max_teams: number;
  registration_open_date: string;
  registration_close_date: string;
}

const LeagueDetailsScreen = () => { // Renamed component for clarity
  const router = useRouter();
  const { id: leagueId } = useLocalSearchParams(); // Get the league ID from the URL
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]); // List of divisions in this league
  const [currentLeagueName, setCurrentLeagueName] = useState<string>(''); // To display league name

  // State to hold standings for a *selected* division (if you want to show one by default or expand)
  // For simplicity, we'll just list divisions for now. You might add a separate screen for division standings.

  const fetchLeagueDetailsAndDivisions = useCallback(async () => {
    if (!leagueId) {
      setError('League ID not provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !currentSession || !currentSession.user) {
        Alert.alert('Authentication Required', 'Please log in to view league details.');
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
        throw new Error('User profile or tenant ID not found. Cannot fetch divisions.');
      }

      const userTenantId = userData.tenant_id;

      // 1. Fetch League name (for display)
      const { data: leagueData, error: leagueFetchError } = await supabase
        .from('leagues')
        .select('name')
        .eq('id', leagueId)
        .eq('tenant_id', userTenantId)
        .single();

      if (leagueFetchError || !leagueData) {
        throw new Error(leagueFetchError?.message || 'League not found or you do not have access.');
      }
      setCurrentLeagueName(leagueData.name);


      // 2. Fetch all divisions for this specific league_id and tenant_id
      const { data: divisionsData, error: divisionsError } = await supabase
        .from('divisions') // Now fetching from the 'divisions' table
        .select('id, name, league_id, tenant_id, created_at, type, rating_system, ruleset, max_teams, registration_open_date, registration_close_date')
        .eq('league_id', leagueId) // Filter by the league ID from URL
        .eq('tenant_id', userTenantId)
        .order('created_at', { ascending: false });

      if (divisionsError) {
        throw new Error(divisionsError.message);
      }

      setDivisions(divisionsData || []);

    } catch (err: any) {
      console.error('Error in fetchLeagueDetailsAndDivisions:', err);
      setError(`Failed to load divisions: ${err.message}`);
      if (err.message.includes('Authentication') || err.message.includes('User not authenticated')) {
        supabase.auth.signOut();
        router.replace('/');
      }
    } finally {
      setLoading(false);
    }
  }, [leagueId, router]); // Dependency on leagueId

  useEffect(() => {
    fetchLeagueDetailsAndDivisions();

    // Setup auth state change listener (optional but good practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession || _event === 'SIGNED_OUT') {
        fetchLeagueDetailsAndDivisions();
      }
    });

    // Realtime subscription for 'divisions' table changes related to this league (more complex to filter in client, refetch for simplicity)
    const divisionsChannel = supabase
        .channel(`public:divisions:league_id=eq.${leagueId}`) // Listen to changes only for this league ID
        .on('postgres_changes', { event: '*', schema: 'public', table: 'divisions', filter: `league_id=eq.${leagueId}` }, (payload) => {
            console.log('Division change detected for this league:', payload);
            fetchLeagueDetailsAndDivisions();
        })
        .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(divisionsChannel);
    };
  }, [fetchLeagueDetailsAndDivisions, leagueId]);


  // You might want to navigate to a screen to view standings for a specific division
  const handleViewDivisionStandings = (divisionId: string) => {
    // router.push(`/divisions/${divisionId}/standings`); // Example route
    Alert.alert("Coming Soon", `View standings for division: ${divisionId}`);
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading divisions for this league...</Text>
      </View>
    );
  }

  if (!session) {
      return null;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.detailText}>Could not load league divisions. Please try again.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{currentLeagueName || 'League'} Divisions</Text>

      {divisions.length === 0 ? (
        <Text style={styles.noDataText}>No divisions found for this league. An admin needs to create them.</Text>
      ) : (
        <FlatList
          data={divisions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.divisionItem} onPress={() => handleViewDivisionStandings(item.id)}>
              <Text style={styles.divisionName}>{item.name}</Text>
              <Text style={styles.divisionDetail}>Type: {item.type}</Text>
              {/* You might add more details from your division schema here */}
              <Text style={styles.viewStandingsButtonText}>View Standings</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  detailText: { // ADD THIS STYLE
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 10,
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
  noDataText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },
  divisionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  divisionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 5,
  },
  divisionDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  viewStandingsButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 10,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
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

export default LeagueDetailsScreen;