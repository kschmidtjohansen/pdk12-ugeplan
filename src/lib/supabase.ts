
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Get environment variables or use fallback values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock Supabase client if the URL is missing
let supabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please ensure both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  
  // Create a mock client that won't throw errors but will log operations
  const mockMethods = {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      eq: () => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
      order: () => ({ data: [], error: null }),
      in: () => ({ data: [], error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ 
        data: { subscription: { unsubscribe: () => {} } },
        error: null
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
    }),
  };
  
  supabaseClient = mockMethods;
} else {
  // Create a real Supabase client if we have the URL and key
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;

// Helper functions to handle standard API responses
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  throw new Error(error?.message || 'An unknown error occurred');
};
