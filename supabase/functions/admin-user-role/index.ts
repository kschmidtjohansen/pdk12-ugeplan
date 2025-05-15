
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RoleUpdateRequest {
  userId: string;
  role: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.pdk12.dk',
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

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create supabase client with service role key
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    // Create authenticated client to verify the user's role
    const authClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Get the current user's role for authorization
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check if user is an administrator
    const { data: roleData } = await authClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'administrator') {
      throw new Error('Unauthorized - requires administrator role');
    }

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
    console.error('User role update error:', error.message);
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
