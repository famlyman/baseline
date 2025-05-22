import { Session } from '@supabase/supabase-js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import supabase from '../../../utils/supabaseClient'; // Adjust path as needed

// Define types for Division and PlayerStanding
interface Division {
  id: string;
  name: string;
  league_id: string;
  tenant_id: string;
  type: 'Singles' | 'Doubles' | 'Mixed';
  gender: 'Men\'s' | 'Women\'s' | null;
  // Add other columns if you display them
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

const DivisionStandingsScreen = () => {
  const router = useRouter();
  const { id: divisionId } = useLocalSearchParams(); // Get the division ID from the URL
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [divisionDetails, setDivisionDetails] = useState<Division | null>(null);
  const [standings, setStandings] = useState<PlayerStanding[]>([]);

  const fetchDivisionDetailsAndStandings = useCallback(async () => {
    if (!divisionId) {
      setError('Division ID not provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !currentSession || !currentSession.user) {
        Alert.alert('Authentication Required', 'Please log in to view division standings.');
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
        throw new Error('User profile or tenant ID not found. Cannot fetch division details.');
      }

      const userTenantId = userData.tenant_id;

      // 1. Fetch Division details (name, type, gender)
      const { data: divData, error: divError } = await supabase
        .from('divisions')
        .select('id, name, league_id, tenant_id, type, gender')
        .eq('id', divisionId)
        .eq('tenant_id', userTenantId)
        .maybeSingle(); // Use maybeSingle in case the ID doesn't exist or tenant mismatch

      if (divError) {
        throw new Error(divError.message);
      }
      if (!divData) {
        throw new Error('Division not found or you do not have access.');
      }
      setDivisionDetails(divData);

      // 2. Fetch Standings for this specific division
      const { data: standingsData, error: standingsError } = await supabase.rpc('get_division_standings', {
        p_division_id: divisionId,
      });

      if (standingsError) {
        throw new Error(standingsError.message);
      }
      setStandings(standingsData || []);

    } catch (err: any) {
      console.error('Error in fetchDivisionDetailsAndStandings:', err);
      setError(`Failed to load standings: ${err.message}`);
      if (err.message.includes('Authentication') || err.message.includes('User not authenticated')) {
        supabase.auth.signOut();
        router.replace('/');
      }
    } finally {
      setLoading(false);
    }
  }, [divisionId, router]);

  useEffect(() => {
    fetchDivisionDetailsAndStandings();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession || _event === 'SIGNED_OUT') {
        fetchDivisionDetailsAndStandings();
      }
    });

    // Realtime subscription for 'divisions' table changes for this specific division
    // and 'player_stats' (or whatever table holds the underlying data for standings)
    const divisionChannel = supabase
      .channel(`public:divisions:id=eq.${divisionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'divisions', filter: `id=eq.${divisionId}` }, (payload) => {
        console.log('Specific Division change detected:', payload);
        fetchDivisionDetailsAndStandings();
      })
      .subscribe();

    // Assuming standings data comes from a 'player_stats' or similar table for real-time updates
    // You might need to adjust this channel if your standings are computed elsewhere
    const standingsChannel = supabase
        .channel(`public:player_stats:division_id=eq.${divisionId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'player_stats', filter: `division_id=eq.${divisionId}` }, (payload) => {
            console.log('Player Stats change detected for this division:', payload);
            fetchDivisionDetailsAndStandings();
        })
        .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(divisionChannel);
      supabase.removeChannel(standingsChannel); // Clean up standings channel
    };
  }, [fetchDivisionDetailsAndStandings, divisionId]);


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading division standings...</Text>
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
        <Text style={styles.detailText}>Could not load division standings. Please try again.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>
          {divisionDetails?.name || 'Division'} Standings
        </Text>
        {divisionDetails?.type && (
          <Text style={styles.subHeader}>
            Type: {divisionDetails.type} {divisionDetails.gender ? `(${divisionDetails.gender})` : ''}
          </Text>
        )}

        {standings.length === 0 ? (
          <Text style={styles.noDataText}>No standings available yet for this division. Start playing!</Text>
        ) : (
          <FlatList
            data={standings}
            keyExtractor={(item) => item.player_id}
            renderItem={({ item: standing, index }) => (
              <View style={styles.standingItem}>
                <Text style={styles.rank}>{index + 1}.</Text>
                <Text style={styles.playerName}>{standing.player_name}</Text>
                <Text style={styles.score}>W:{standing.wins} L:{standing.losses} D:{standing.draws} Pts:{standing.points}</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.standingSeparator} />}
          />
        )}
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
  detailText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10, // Reduced margin
    color: '#333',
    textAlign: 'center',
  },
  subHeader: { // New style for division type/gender
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
  },
  standingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
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
    marginVertical: 2,
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

export default DivisionStandingsScreen;