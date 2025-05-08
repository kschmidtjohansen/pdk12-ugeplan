
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase SERVICE ROLE KEY - env var exported by default
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      // Create client with Auth context of the server
      { global: { headers: { Authorization: authorization } } }
    );

    // Get request body
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete user using admin API
    const { error } = await supabaseClient.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Admin delete user error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete user" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
