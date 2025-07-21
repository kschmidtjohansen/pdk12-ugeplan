
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://cyuyrpwtkljfiqwgasmn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dXlycHd0a2xqZmlxd2dhc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3Njg5ODEsImV4cCI6MjA2MjM0NDk4MX0.j6NYT5jwYaYhZYVsRqW20T6_I9WkcqSmZ-rHyA78k5U';

// Use a singleton pattern to avoid multiple client instances
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
})();

// Session validation function
export const ensureValidSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session validation error:', error);
      return false;
    }
    return !!session;
  } catch (error) {
    console.error('Session validation failed:', error);
    return false;
  }
};

// Retry utility function
export const withRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`${operationName} attempt ${attempt} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};
