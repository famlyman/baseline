import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import CreateLeagueForm from '../../../components/CreateLeagueForm'; // Adjust path if necessary
import supabase from '../../../utils/supabaseClient'; // Adjust path

// Define types for better type safety (can be shared from AdminDashboardHome)
interface League {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  status: string;
  tenant_id: string;
  rating_system: string; // <-- Add rating_system to League interface
  registration_open_date?: string; // Add if you moved it to league
  registration_close_date?: string; // Add if you moved it to league
}

// Update the type for leagueData passed from the form
interface CreateLeagueFormData {
  name: string;
  start_date: string;
  end_date?: string;
  status: string;
  rating_system: string; // <-- Add rating_system here
  registration_open_date?: Date | null; // Assuming your form passes Date objects or null
  registration_close_date?: Date | null;
}

const CreateLeagueScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

  // Fetch tenant ID for league creation
  useEffect(() => {
    const fetchUserTenantId = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: userAuthError } = await supabase.auth.getUser();
        if (userAuthError || !user) {
          throw new Error(userAuthError?.message || 'User not authenticated.');
        }

        const { data: userData, error: userProfileError } = await supabase
          .from('users')
          .select('tenant_id, role')
          .eq('id', user.id)
          .maybeSingle();

        if (userProfileError) {
          throw new Error(userProfileError.message);
        }

        if (!userData || !userData.tenant_id) {
          Alert.alert('Error', 'Tenant ID not found for current user. Please ensure your profile is correct.');
          router.replace('./AdminAreaNavigator/AdminDashboardHome'); // Redirect if no tenant ID
          return;
        }

        // Basic role check, more robust checking usually in RLS and AuthProvider
        if (userData.role !== 'coordinator') {
            Alert.alert('Access Denied', 'You are not authorized to create leagues.');
            router.replace('../(tabs)/home');
            return;
        }

        setCurrentTenantId(userData.tenant_id);
      } catch (err: any) {
        console.error('Error fetching tenant ID for league creation:', err);
        setError(`Failed to prepare form: ${err.message}`);
        Alert.alert('Error', `Failed to prepare form: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchUserTenantId();
  }, [router]);

  // Update handleCreateLeague to accept CreateLeagueFormData
  const handleCreateLeague = useCallback(async (
    leagueData: CreateLeagueFormData // <-- Changed type here
  ) => {
    if (!currentTenantId) {
      Alert.alert('Error', 'Tenant ID is not available. Cannot create league.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Ensure dates are in ISO string format if coming from Date objects
      const startDateISO = leagueData.start_date; // Assuming already string or handle conversion
      const endDateISO = leagueData.end_date || null;
      const registrationOpenDateISO = leagueData.registration_open_date ? leagueData.registration_open_date.toISOString() : null;
      const registrationCloseDateISO = leagueData.registration_close_date ? leagueData.registration_close_date.toISOString() : null;


      const { data: newLeague, error: insertError } = await supabase
        .from('leagues')
        .insert({
          name: leagueData.name,
          start_date: startDateISO,
          end_date: endDateISO,
          status: leagueData.status,
          tenant_id: currentTenantId,
          rating_system: leagueData.rating_system, // <-- Insert rating_system into league
          registration_open_date: registrationOpenDateISO, // Add if moved to league
          registration_close_date: registrationCloseDateISO, // Add if moved to league
        })
        .select() // Use .select() to get the inserted row
        .single(); // Use .single() if you expect one row back

      if (insertError) {
        setError(insertError.message);
        console.error('Error creating league:', insertError);
        Alert.alert('Error creating league', insertError.message);
      } else if (newLeague) { // Check newLeague directly, not data.length
        console.log('League created successfully:', newLeague);

        // CALL THE RPC TO CREATE DEFAULT DIVISIONS HERE!
        const { error: rpcError } = await supabase.rpc('create_default_divisions_for_league', {
          p_league_id: newLeague.id, // ID of the newly created league
          p_tenant_id: currentTenantId,
          p_league_rating_system: newLeague.rating_system, // Pass the rating system from the new league
        });

        if (rpcError) {
          setError(rpcError.message);
          console.error('Error creating default divisions:', rpcError);
          Alert.alert('Error creating default divisions', rpcError.message);
          // Optional: You might want to delete the newly created league if division creation fails,
          // or mark it with a special status for admin review. For now, we'll just alert.
        } else {
          Alert.alert('Success', 'League and default divisions created successfully!');
          router.back(); // Go back to AdminDashboardHome after successful creation
        }
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Unexpected error creating league:', err);
      Alert.alert('Unexpected error creating league', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentTenantId, router]);

  const handleCancelCreateLeague = useCallback(() => {
    router.back(); // Go back to the previous screen (AdminDashboardHome)
  }, [router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Preparing league creation form...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New League</Text>
      {currentTenantId ? (
        <CreateLeagueForm onCreateLeague={handleCreateLeague} onCancel={handleCancelCreateLeague} />
      ) : (
        <Text style={styles.detailText}>Loading tenant information to create league...</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
    textAlign: 'center',
  },
});

export default CreateLeagueScreen;