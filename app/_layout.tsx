import { Session } from '@supabase/supabase-js';
import { Slot, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import supabase from '../utils/supabaseClient'; // Adjust path

// Import the new AdminAreaNavigator
import AdminAreaNavigator from './(app)/AdminAreaNavigator';

// This is a simplified AuthProvider for _layout.tsx
// In a real app, you'd likely have a dedicated context for auth state.
// For now, we'll fetch session and user role directly here.
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null); // State to hold the user's role

  useEffect(() => {
    const fetchSession = async () => {
      setLoadingSession(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);

        if (session?.user) {
          // Fetch user role if session exists
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) throw profileError;
          setUserRole(userProfile?.role || null);
        } else {
          setUserRole(null);
        }

      } catch (e: any) {
        console.error("Auth Session Error:", e.message);
        setSession(null);
        setUserRole(null);
      } finally {
        setLoadingSession(false);
      }
    };

    fetchSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Re-fetch role on auth state change if needed
        supabase.from('users').select('role').eq('id', newSession.user.id).maybeSingle()
          .then(({ data: userProfile, error: profileError }) => {
            if (profileError) console.error("Error fetching role on auth change:", profileError);
            setUserRole(userProfile?.role || null);
          });
      } else {
        setUserRole(null);
      }
      setLoadingSession(false); // Session has changed, no longer loading
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loadingSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading application...</Text>
      </View>
    );
  }

  // Pass session and role to children (though not explicitly used by RootLayoutNav, it controls what's rendered)
  return (
    <AuthContext.Provider value={{ session, loading: loadingSession, userRole }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a simple AuthContext if you don't have a full one yet
// This is a minimal example for _layout.tsx
import { createContext, useContext } from 'react';
interface AuthContextType {
    session: Session | null;
    loading: boolean;
    userRole: string | null;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};


function RootLayoutNav() {
  const { session, userRole } = useAuth(); // Use the simplified useAuth from above

  // If user is authenticated and is a coordinator, show the AdminAreaNavigator
  if (session && session.user && userRole === 'coordinator') {
    return <AdminAreaNavigator />; // This will render the Drawer Navigator
  }

  // If user is authenticated but not a coordinator (e.g., player), or if role not loaded yet
  // Display default app stack (e.g., Home screen for players)
  if (session && session.user) {
    return (
      <Stack>
        {/* Assumes a public/(app)/home.tsx route for general authenticated users */}
        <Stack.Screen name="(tabs)/home" options={{ headerShown: false }} />
        {/* You can add more authenticated routes here */}
        <Stack.Screen name="(tabs)/profile" options={{ title: 'User Profile' }} />
      </Stack>
    );
  }

  // If no session, show login/onboarding flow
  return (
    <Stack>
      {/* Assumes public/(app)/index.tsx is your login screen */}
      <Stack.Screen name="(tabs)/index" options={{ headerShown: false }} />
      <Stack.Screen name="/TenantCreation" options={{ title: "Create New Tenant" }} />
      {/* Other public routes */}
    </Stack>
  );
}

export default function RootLayout() {
  // You might have font loading here, keeping it minimal for clarity
  // const [loaded, error] = useFonts({ ... });
  // useEffect(() => { if (error) throw error; }, [error]);
  // if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </SafeAreaProvider>
  );
}