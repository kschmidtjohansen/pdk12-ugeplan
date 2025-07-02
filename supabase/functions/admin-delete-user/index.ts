
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  
  console.log(`[${requestId}] REQUEST START - Method: ${req.method}, URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] Handling CORS preflight`);
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'DELETE') {
    console.log(`[${requestId}] Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log(`[${requestId}] Auth header present: ${!!authHeader}`);
    
    if (!authHeader) {
      console.error(`[${requestId}] Missing authorization header`);
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log(`[${requestId}] Environment check:`, {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Missing environment variables`);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create admin Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the current user is authenticated and is admin
    const token = authHeader.replace('Bearer ', '');
    console.log(`[${requestId}] Verifying token (length: ${token.length})`);
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error(`[${requestId}] Auth verification error:`, authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] User authenticated: ${user.id} (${user.email})`);

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'administrator') {
      console.error(`[${requestId}] User not admin. Role: ${roleData?.role}, User: ${user.email}`);
      return new Response(
        JSON.stringify({ error: 'Administrator access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 1];

    if (!userId || userId === 'admin-delete-user') {
      return new Response(
        JSON.stringify({ error: 'User ID is required in URL path' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] Deleting user: ${userId}`);

    // Prevent self-deletion
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Delete user from auth (this will cascade to profiles and user_roles due to foreign keys)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error(`[${requestId}] Failed to delete user:`, deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] User deleted successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User deleted successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        requestId
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
