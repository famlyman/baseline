import { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import supabase from '../../../utils/supabaseClient'; // Adjusted path for (tabs) structure

// Define type for top-level League
interface League {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  status: string;
  tenant_id: string;
  created_at: string;
}

const LeaguesScreen = () => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]); // State to hold top-level leagues

  const fetchUserSessionAndLeagues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !currentSession || !currentSession.user) {
        Alert.alert('Authentication Required', 'Please log in to view leagues.');
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
        throw new Error('User profile or tenant ID not found. Cannot fetch leagues.');
      }

      const userTenantId = userData.tenant_id;

      // Fetch all leagues for this tenant
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('leagues') // Now fetching from the 'leagues' table (formerly 'seasons')
        .select('id, name, start_date, end_date, status, created_at, tenant_id')
        .eq('tenant_id', userTenantId)
        .order('created_at', { ascending: false });

      if (leaguesError) {
        throw new Error(leaguesError.message);
      }

      setLeagues(leaguesData || []);

    } catch (err: any) {
      console.error('Error in fetchUserSessionAndLeagues:', err);
      setError(`Failed to load leagues: ${err.message}`);
      if (err.message.includes('Authentication') || err.message.includes('User not authenticated')) {
        supabase.auth.signOut();
        router.replace('/');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserSessionAndLeagues();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession || _event === 'SIGNED_OUT') {
        fetchUserSessionAndLeagues();
      }
    });

    // Realtime subscription for 'leagues' table changes
    const leaguesChannel = supabase
        .channel('public:leagues')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leagues' }, (payload) => {
            console.log('League change detected:', payload);
            fetchUserSessionAndLeagues();
        })
        .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(leaguesChannel);
    };
  }, [fetchUserSessionAndLeagues]);

  const handleViewDivisions = (leagueId: string) => {
    router.push({
      pathname: '/leagues/[id]', // Use the pathname with the dynamic segment placeholder
      params: { id: leagueId }, // Pass the actual ID as a param
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading your leagues...</Text>
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
        <Text style={styles.detailText}>Could not load leagues. Please try again.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}> 
    <View style={styles.container}>
    <Text style={styles.header}>Your Leagues</Text>
    
    {leagues.length === 0 ? (
    <Text style={styles.noDataText}>No leagues found for your tenant. An admin needs to create one.</Text>
    ) : (
    <FlatList
    data={leagues}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
    <TouchableOpacity style={styles.leagueItem} onPress={() => handleViewDivisions(item.id)}>
    <Text style={styles.leagueName}>{item.name}</Text>
    <Text style={styles.leagueDetail}>Status: {item.status}</Text>
    <Text style={styles.leagueDetail}>Start: {new Date(item.start_date).toLocaleDateString()}</Text>
    {item.end_date && <Text style={styles.leagueDetail}>End: {new Date(item.end_date).toLocaleDateString()}</Text>}
    <Text style={styles.viewDivisionsButtonText}>View Divisions & Standings</Text>
    </TouchableOpacity>
    )}
    ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
    )}
    </View>
    </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  safeArea: { // Add this style for SafeAreaView
    flex: 1,
    backgroundColor: '#F5F5F5', // Match your container background
    },
    container: {
    flex: 1,
    paddingHorizontal: 20, // Adjust padding if needed, SafeAreaView handles top/bottom
    paddingTop: 10, // Add a bit of padding below the header if needed
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
  leagueItem: {
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
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 5,
  },
  leagueDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  viewDivisionsButtonText: {
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
});

export default LeaguesScreen;