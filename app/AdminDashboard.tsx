import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CreateLeagueForm from '../components/CreateLeagueForm';
import supabase from '../utils/supabaseClient';

// Define types for better type safety
interface Tenant {
  id: string;
  name: string;
  is_private: boolean;
  join_code: string | null;
  // Add other tenant fields as needed
}

interface League {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  status: string;
  tenant_id: string;
  // Add other league fields as needed
}

const AdminDashboardScreen = () => {
  const router = useRouter();
  const [isCreatingLeague, setIsCreatingLeague] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<Tenant | null>(null);

  const fetchTenantAndUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user }, error: userAuthError } = await supabase.auth.getUser();

      if (userAuthError || !user) {
        throw new Error(userAuthError?.message || 'User not authenticated.');
      }

      // Fetch user's tenant_id from public.users table
      // Use .maybeSingle() to handle cases where the user's entry might not exist yet
      const { data: userData, error: userProfileError } = await supabase
        .from('users')
        .select('tenant_id') // Only need tenant_id for now
        .eq('id', user.id)
        .maybeSingle(); // <--- CHANGED THIS TO .maybeSingle()

      if (userProfileError) {
        throw new Error(userProfileError.message);
      }

      // If userData is null, it means no profile was found for this user in public.users
      if (!userData || !userData.tenant_id) {
        // This is the crucial check: If user profile is missing, throw an error
        throw new Error('User profile or tenant ID not found in database. Please ensure your profile is set up correctly (e.g., re-sign up or check user data).');
      }
      
      setCurrentTenantId(userData.tenant_id);

      // Fetch the actual tenant details using the tenant_id
      const { data: tenantData, error: tenantDetailsError } = await supabase
        .from('tenants')
        .select('id, name, is_private, join_code')
        .eq('id', userData.tenant_id)
        .single(); // This should still be .single() as tenant_id should be unique and always exist

      if (tenantDetailsError || !tenantData) {
        throw new Error(tenantDetailsError?.message || 'Tenant details not found.');
      }
      setTenantInfo(tenantData);

    } catch (err: any) {
      console.error('Error in fetchTenantAndUserData:', err);
      setError(`Failed to load user/tenant data: ${err.message}`);
      Alert.alert('Load Error', `Failed to load user/tenant data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeagues = useCallback(async () => {
    if (!currentTenantId) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error: leaguesError } = await supabase
        .from('leagues')
        .select('id, name, start_date, end_date, status, tenant_id')
        .eq('tenant_id', currentTenantId)
        .order('start_date', { ascending: false });

      if (leaguesError) {
        throw new Error(leaguesError.message);
      } else if (data) {
        setLeagues(data as League[]);
      }
    } catch (err: any) {
      console.error('Error fetching leagues:', err);
      setError(`Error loading leagues: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentTenantId]);

  useEffect(() => {
    fetchTenantAndUserData();
  }, [fetchTenantAndUserData]);

  useEffect(() => {
    if (currentTenantId) {
      fetchLeagues();

      // --- Realtime Subscriptions ---
      const tenantChannel = supabase
        .channel(`public:tenants:id=eq.${currentTenantId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants', filter: `id=eq.${currentTenantId}` }, (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setTenantInfo(payload.new as Tenant);
          }
        })
        .subscribe();

      const leaguesChannel = supabase
        .channel(`public:leagues:tenant_id=eq.${currentTenantId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leagues', filter: `tenant_id=eq.${currentTenantId}` }, (payload) => {
          setLeagues(prevLeagues => {
            const newLeague = payload.new as League;
            const oldLeague = payload.old as League;
            switch (payload.eventType) {
              case 'INSERT':
                return [newLeague, ...prevLeagues];
              case 'UPDATE':
                return prevLeagues.map(l => l.id === newLeague.id ? newLeague : l);
              case 'DELETE':
                return prevLeagues.filter(l => l.id !== oldLeague.id);
              default:
                return prevLeagues;
            }
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(tenantChannel);
        supabase.removeChannel(leaguesChannel);
      };
    }
  }, [currentTenantId, fetchLeagues]);

  const handleCreateLeague = () => {
    router.push('/(app)/screens/CreateLeagueScreen');
  };

  const handleCancelCreateLeague = () => {
    setIsCreatingLeague(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) {
        throw new Error(logoutError.message);
      }
      router.replace('/Login');
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(`Logout failed: ${err.message}`);
      Alert.alert('Logout Error', `Failed to log out: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Go to Login / Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      {tenantInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Tenant:</Text>
          <Text style={styles.detailText}>Name: {tenantInfo.name}</Text>
          <Text style={styles.detailText}>Private: {tenantInfo.is_private ? 'Yes' : 'No'}</Text>
          {tenantInfo.is_private && tenantInfo.join_code && (
            <Text style={styles.detailText}>Join Code: {tenantInfo.join_code}</Text>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.createButton} onPress={handleCreateLeague}>
        <Text style={styles.buttonText}>Create New League</Text>
      </TouchableOpacity>

      {isCreatingLeague && (
        <CreateLeagueForm onCreateLeague={handleCreateLeague} onCancel={handleCancelCreateLeague} />
      )}

      <Text style={styles.subtitle}>Your Leagues</Text>
      {leagues.length === 0 ? (
        <Text style={styles.detailText}>No leagues found for this tenant. Create one above!</Text>
      ) : (
        <FlatList
          data={leagues}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.leagueItem}>
              <Text style={styles.leagueName}>{item.name}</Text>
              <Text>Status: {item.status}</Text>
              <Text>Start Date: {item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A'}</Text>
              <Text>End Date: {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A'}</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '80%',
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
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1E3A8A',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  leagueItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  logoutButton: {
    backgroundColor: '#DC3545', // Red
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
});

export default AdminDashboardScreen;