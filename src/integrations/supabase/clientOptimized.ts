
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Use environment variables with fallback to hardcoded values for development
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://cyuyrpwtkljfiqwgasmn.supabase.co'
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dXlycHd0a2xqZmlxd2dhc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3Njg5ODEsImV4cCI6MjA2MjM0NDk4MX0.j6NYT5jwYaYhZYVsRqW20T6_I9WkcqSmZ-rHyA78k5U'

export const supabaseOptimized = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Application-Name': 'PDK12-Assignment-System-Optimized'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Limit realtime events to prevent overwhelming
    }
  }
})

// Session cache to reduce validation calls
let sessionCache: { session: any; timestamp: number } | null = null;
const SESSION_CACHE_TTL = 60000; // 1 minute cache

// Enhanced session validation with caching and retry logic
export const ensureValidSessionOptimized = async (retries: number = 2): Promise<boolean> => {
  try {
    // Check cache first
    if (sessionCache && (Date.now() - sessionCache.timestamp) < SESSION_CACHE_TTL) {
      return !!sessionCache.session?.user;
    }

    const { data: { session }, error } = await supabaseOptimized.auth.getSession();
    
    if (error) {
      console.error('[ensureValidSessionOptimized] Session validation error:', error);
      
      // Try to refresh session on error
      if (retries > 0) {
        console.log('[ensureValidSessionOptimized] Attempting session refresh...');
        const { error: refreshError } = await supabaseOptimized.auth.refreshSession();
        
        if (!refreshError) {
          return ensureValidSessionOptimized(retries - 1);
        }
      }
      
      // Clear cache on error
      sessionCache = null;
      return false;
    }
    
    // Update cache
    sessionCache = {
      session,
      timestamp: Date.now()
    };
    
    return !!session?.user;
  } catch (error) {
    console.error('[ensureValidSessionOptimized] Error checking session:', error);
    
    // Retry with exponential backoff
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
      return ensureValidSessionOptimized(retries - 1);
    }
    
    sessionCache = null;
    return false;
  }
};

// Clear session cache when needed
export const clearSessionCache = () => {
  sessionCache = null;
};

// Enhanced error recovery for database operations
export const withRetry = async <T>(
  operation: () => Promise<T>, 
  operationName: string = 'Database operation',
  maxRetries: number = 2
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`[withRetry] ${operationName} failed on attempt ${attempt + 1}:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};
