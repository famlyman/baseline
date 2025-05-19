import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Replace with your Supabase Project URL and Anon Key
const supabaseUrl = 'https://wrwzlcsxzdoaftdzgsla.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indyd3psY3N4emRvYWZ0ZHpnc2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzY1MTc5MSwiZXhwIjoyMDYzMjI3NzkxfQ.LzrizexpaHg6hcuueQuVkDsUCnwkVjwIb5MB9SWg1pU';

const supabaseOptions = {
  auth: {
    storage: Platform.OS === 'web' 
      ? {
          getItem: (key: string) => {
            if (typeof window !== 'undefined') {
              return Promise.resolve(window.localStorage.getItem(key));
            }
            return Promise.resolve(null);
          },
          setItem: (key: string, value: string) => {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(key, value);
            }
            return Promise.resolve();
          },
          removeItem: (key: string) => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(key);
            }
            return Promise.resolve();
          },
        }
      : {
          getItem: (key: string) => AsyncStorage.getItem(key),
          setItem: (key: string, value: string) => AsyncStorage.setItem(key, value).then(() => {}),
          removeItem: (key: string) => AsyncStorage.removeItem(key).then(() => {}),
        },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
};

const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

export default supabase;