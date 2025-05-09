
// Follow this setup guide to integrate the Deno runtime and use Edge Functions:
// https://docs.supabase.com/docs/guides/functions/getting-started
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RoleUpdateRequest {
  userId: string;
  role: string;
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
    const { userId, role } = await req.json() as RoleUpdateRequest;

    if (!userId || !role) {
      throw new Error('Missing required fields');
    }

    // Validate role is one of the expected values
    const validRoles = ['administrator', 'skadeleder', 'servicemedarbejder'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role specified');
    }

    // Update user role in the database
    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);

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
