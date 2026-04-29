
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://cyuyrpwtkljfiqwgasmn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dXlycHd0a2xqZmlxd2dhc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3Njg5ODEsImV4cCI6MjA2MjM0NDk4MX0.j6NYT5jwYaYhZYVsRqW20T6_I9WkcqSmZ-rHyA78k5U';

/**
 * "Husk mig"-aware storage:
 * - Når brugeren har valgt "Husk mig" (`auth_remember_me === '1'`) skrives sessionen til
 *   localStorage og overlever lukning af browseren.
 * - Ellers skrives den til sessionStorage og forsvinder når browser-tabben lukkes.
 *
 * Skift af præference læses dynamisk pr. kald, så toggle på loginsiden
 * tager effekt med det samme.
 */
const REMEMBER_KEY = 'auth_remember_me';

const isRemembered = (): boolean => {
  if (typeof window === 'undefined') return true;
  // Default true for backwards compatibility — eksisterende sessioner i localStorage skal stadig virke.
  const v = window.localStorage.getItem(REMEMBER_KEY);
  return v === null ? true : v === '1';
};

const hybridStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    if (isRemembered()) return window.localStorage.getItem(key);
    return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    if (isRemembered()) {
      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
      window.localStorage.removeItem(key);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

// Use a singleton pattern to avoid multiple client instances
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        storage: typeof window !== 'undefined' ? hybridStorage : undefined,
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
      if (import.meta.env.DEV) console.error('Session validation error:', error);
      return false;
    }
    return !!session;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Session validation failed:', error);
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
      if (import.meta.env.DEV) console.warn(`${operationName} attempt ${attempt} failed:`, lastError.message);
      
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
