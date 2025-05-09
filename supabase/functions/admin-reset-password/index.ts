
// Follow this setup guide to integrate the Deno runtime and use Edge Functions:
// https://docs.supabase.com/docs/guides/functions/getting-started
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ResetRequest {
  userId: string;
  newPassword: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    // Create supabase client with service role key
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    // Parse request body
    const { userId, newPassword } = await req.json() as ResetRequest;

    if (!userId || !newPassword) {
      throw new Error('Missing required fields');
    }

    // Use Supabase auth admin API to update the user's password
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400,
      }
    );
  }
});
