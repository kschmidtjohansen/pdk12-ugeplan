
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://iaxxrnixwmysxrsycohx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlheHhybml4d215c3hyc3ljb2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0MTIxODQsImV4cCI6MjA2MTk4ODE4NH0.zcC_G2a4Q2Zx1CoV1PmPzu700lSsMXrUCS7MpbJHHng";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
