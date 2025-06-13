
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cyuyrpwtkljfiqwgasmn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dXlycHd0a2xqZmlxd2dhc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3Njg5ODEsImV4cCI6MjA2MjM0NDk4MX0.j6NYT5jwYaYhZYVsRqW20T6_I9WkcqSmZ-rHyA78k5U";

// Optimized Supabase client with performance enhancements
export const supabaseOptimized = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce',
      debug: import.meta.env.DEV,
      storage: {
        getItem: (key) => {
          try {
            const value = localStorage.getItem(key);
            return value;
          } catch (error) {
            console.error('[supabaseOptimized] Error accessing localStorage:', error);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, value);
          } catch (error) {
            console.error('[supabaseOptimized] Error writing to localStorage:', error);
          }
        },
        removeItem: (key) => {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.error('[supabaseOptimized] Error removing from localStorage:', error);
          }
        },
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 5, // Reduced from 10 for better performance
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-optimized/2.43.1'
      },
    },
  }
);

// Enhanced error handler with better categorization
export const handleSupabaseErrorOptimized = (error: any, context?: string) => {
  if (!error) return null;
  
  const errorContext = context ? `[${context}] ` : '';
  console.error(`${errorContext}Supabase operation failed:`, error);
  
  // Categorize errors for better handling
  const errorCategory = {
    message: error.message || 'An unexpected error occurred',
    code: error.code || 'unknown_error',
    status: error.status || 500,
    category: 'unknown'
  };

  // Authentication errors
  if (['refresh_token_not_found', 'invalid_token', 'expired_token'].includes(error.code)) {
    errorCategory.category = 'auth';
  }
  // Permission errors
  else if (error.code === 'PGRST301' || error.message?.includes('row-level security')) {
    errorCategory.category = 'permission';
  }
  // Database constraint errors
  else if (error.code === 'P0001' || error.code === '23503') {
    errorCategory.category = 'constraint';
  }
  // Network errors
  else if (error.code === 'network_error' || error.message?.includes('fetch')) {
    errorCategory.category = 'network';
  }

  return errorCategory;
};

// Optimized query wrapper with retry logic
export const enhancedSupabaseOptimized = {
  ...supabaseOptimized,
  safeQuery: async (queryFn: () => Promise<any>, context?: string, retries = 2) => {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await queryFn();
        if (result.error) {
          const errorInfo = handleSupabaseErrorOptimized(result.error, context);
          
          // Don't retry auth or permission errors
          if (errorInfo?.category === 'auth' || errorInfo?.category === 'permission') {
            return result;
          }
          
          // Retry network and unknown errors
          if (attempt < retries && (errorInfo?.category === 'network' || errorInfo?.category === 'unknown')) {
            console.log(`[enhancedSupabaseOptimized] Retrying query, attempt ${attempt + 2}/${retries + 1}`);
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000)); // Exponential backoff
            continue;
          }
        }
        return result;
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          console.log(`[enhancedSupabaseOptimized] Retrying after error, attempt ${attempt + 2}/${retries + 1}`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
      }
    }
    
    handleSupabaseErrorOptimized(lastError, context);
    return { data: null, error: lastError };
  }
};

// Optimized session validation with caching
let sessionCache: { session: any; timestamp: number } | null = null;
const SESSION_CACHE_DURATION = 30000; // 30 seconds

export const ensureValidSessionOptimized = async () => {
  try {
    // Check cache first
    if (sessionCache && (Date.now() - sessionCache.timestamp) < SESSION_CACHE_DURATION) {
      return !!sessionCache.session;
    }
    
    const { data, error } = await supabaseOptimized.auth.getSession();
    
    if (error) {
      console.error('[ensureValidSessionOptimized] Session validation error:', error);
      sessionCache = null;
      return false;
    }
    
    // Update cache
    sessionCache = {
      session: data.session,
      timestamp: Date.now()
    };
    
    if (!data.session) {
      console.log('[ensureValidSessionOptimized] No active session');
      return false;
    }
    
    // Check token expiry and refresh if needed
    const expiresAt = data.session.expires_at;
    if (expiresAt) {
      const expiryTime = expiresAt * 1000;
      const timeToExpiry = expiryTime - Date.now();
      
      // Refresh if expires in less than 5 minutes
      if (timeToExpiry < 300000 && timeToExpiry > 0) {
        console.log('[ensureValidSessionOptimized] Refreshing session token');
        const { error: refreshError } = await supabaseOptimized.auth.refreshSession();
        if (refreshError) {
          console.error('[ensureValidSessionOptimized] Token refresh failed:', refreshError);
          sessionCache = null;
          return false;
        }
        // Clear cache to force refresh on next call
        sessionCache = null;
      }
    }
    
    return true;
  } catch (error) {
    console.error('[ensureValidSessionOptimized] Session check error:', error);
    sessionCache = null;
    return false;
  }
};
