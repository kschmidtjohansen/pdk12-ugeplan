
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
