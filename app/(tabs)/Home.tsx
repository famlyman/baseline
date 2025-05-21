import { Session } from '@supabase/supabase-js'; // Import Session type
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import supabase from '../../utils/supabaseClient'; // Adjusted path for (tabs) structure

interface PlayerStanding {
  player_id: string;
  player_name: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  rank?: number; // Add a rank property for display
}

interface Ladder {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

const HomeScreen = () => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Combines auth and data loading
  const [error, setError] = useState<string | null>(null);
  const [standings, setStandings] = useState<PlayerStanding[]>([]);
  const [currentLadder, setCurrentLadder] = useState<Ladder | null>(null);

  // Function to fetch the user's session and then tenant_id and active ladder
  const fetchSessionAndStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get the current user session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !currentSession || !currentSession.user) {
        // Not authenticated, redirect to login
        Alert.alert('Authentication Required', 'Please log in to view your home dashboard.');
        router.replace('/'); // Redirect to your root (login)
        return;
      }
      setSession(currentSession); // Set session state

      // 2. Fetch user's tenant_id and role
      const { data: userData, error: userProfileError } = await supabase
        .from('users')
        .select('tenant_id, role') // Fetch role as well, though not strictly used here for display
        .eq('id', currentSession.user.id)
        .maybeSingle();

      if (userProfileError) {
        throw new Error(userProfileError.message);
      }
      if (!userData || !userData.tenant_id) {
        throw new Error('User profile or tenant ID not found. Please ensure your profile is set up.');
      }

      const userTenantId = userData.tenant_id;

      // 3. Find the most recent active ladder for this tenant
      const { data: laddersData, error: laddersError } = await supabase
        .from('ladders')
        .select('id, name, status, created_at')
        .eq('tenant_id', userTenantId)
        .eq('status', 'active') // Only fetch active ladders
        .order('created_at', { ascending: false }) // Get the most recent one
        .limit(1)
        .maybeSingle();

      if (laddersError) {
        throw new Error(laddersError.message);
      }

      if (!laddersData) {
        setCurrentLadder(null);
        setStandings([]);
        return; // Exit here, no standings to fetch
      }

      setCurrentLadder(laddersData);

      // 4. Call the Supabase RPC function to get standings
      const { data: standingsData, error: rpcError } = await supabase.rpc('get_ladder_standings', { p_ladder_id: laddersData.id });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const rankedStandings = (standingsData as PlayerStanding[]).map((player, index) => ({
        ...player,
        rank: index + 1,
      }));

      setStandings(rankedStandings);

    } catch (err: any) {
      console.error('Error in fetchSessionAndStandings:', err);
      setError(`Failed to load: ${err.message}`);
      // For critical errors, consider forcing a logout or redirect
      if (err.message.includes('Authentication') || err.message.includes('User not authenticated')) {
        supabase.auth.signOut();
        router.replace('/');
      }
    } finally {
      setLoading(false);
    }
  }, [router]); // Include router in dependency array

  useEffect(() => {
    fetchSessionAndStandings();

    // Set up a listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // If session changes (e.g., user logs in/out), re-fetch all data
      if (newSession || _event === 'SIGNED_OUT') {
        fetchSessionAndStandings();
      }
    });

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSessionAndStandings]); // fetchSessionAndStandings is a stable useCallback

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  // If no session after loading, it means the user was redirected by fetchSessionAndStandings.
  // We can render null or a specific message here.
  if (!session) {
      return null; // The router.replace('/') handles the actual UI change
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.detailText}>Please ensure you are part of a tenant and an active ladder exists.</Text>
        {/* Optional: Add a retry button */}
        {/* <TouchableOpacity onPress={fetchSessionAndStandings} style={styles.retryButton}>
            <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity> */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome Home!</Text>

      <View style={styles.standingsCard}>
        <Text style={styles.cardTitle}>
          {currentLadder ? `${currentLadder.name} Standings` : 'No Active Ladder Standings'}
        </Text>
        {standings.length === 0 && !currentLadder ? (
          <Text style={styles.detailText}>No active ladder found for your tenant. Please contact your coordinator.</Text>
        ) : standings.length === 0 && currentLadder ? (
          <Text style={styles.detailText}>No completed matches yet for this ladder.</Text>
        ) : (
          <FlatList
            data={standings}
            keyExtractor={(item) => item.player_id}
            renderItem={({ item }) => (
              <View style={styles.standingItem}>
                <Text style={styles.rankText}>{item.rank}.</Text>
                <Text style={styles.playerName}>{item.player_name}</Text>
                <Text style={styles.statsText}>W:{item.wins} L:{item.losses} D:{item.draws}</Text>
                <Text style={styles.pointsText}>{item.points} Pts</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

      {/* Potentially other home screen content here */}

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
  standingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1E3A8A',
    textAlign: 'center',
  },
  standingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    width: 30, // Fixed width for rank
  },
  playerName: {
    flex: 1, // Takes up remaining space
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    width: 90, // Fixed width for stats
    textAlign: 'right',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    width: 60, // Fixed width for points
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },
  detailText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default HomeScreen;