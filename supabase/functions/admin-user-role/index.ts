
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (req.method !== 'POST') {
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

    // Get environment variables with enhanced validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log(`[${requestId}] Environment check:`, {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Missing environment variables - URL: ${!!supabaseUrl}, Key: ${!!supabaseServiceKey}`);
      return new Response(
        JSON.stringify({ error: 'Server configuration error - missing environment variables' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create admin Supabase client with enhanced configuration
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });

    // Verify the current user is authenticated and is admin
    const token = authHeader.replace('Bearer ', '');
    console.log(`[${requestId}] Verifying token (length: ${token.length})`);
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error(`[${requestId}] Auth verification error:`, authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError?.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] User authenticated: ${user.id} (${user.email})`);

    // Enhanced admin role check with better error handling
    console.log(`[${requestId}] Checking admin role for user: ${user.id}`);
    
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log(`[${requestId}] Role query result:`, { roleData, roleError: roleError?.message });

    if (roleError) {
      console.error(`[${requestId}] Role query error:`, roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions', details: roleError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!roleData || roleData.role !== 'administrator') {
      console.error(`[${requestId}] User not admin. Role: ${roleData?.role || 'none'}, User: ${user.email}`);
      return new Response(
        JSON.stringify({ 
          error: 'Administrator access required',
          userRole: roleData?.role || 'none',
          userId: user.id
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] Admin verification successful - Role: ${roleData.role}`);

    // Parse request body
    const body = await req.json();
    const { userId, role } = body;

    console.log(`[${requestId}] Request body:`, { userId, role });

    if (!userId || !role) {
      return new Response(
        JSON.stringify({ error: 'User ID and role are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate role value
    const validRoles = ['administrator', 'skadeleder', 'servicemedarbejder'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified', validRoles }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] Updating user ${userId} role to: ${role}`);

    // Check if user exists first
    const { data: targetUser, error: userCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .eq('id', userId)
      .maybeSingle();

    if (userCheckError) {
      console.error(`[${requestId}] Error checking target user:`, userCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify target user', details: userCheckError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!targetUser) {
      console.error(`[${requestId}] Target user not found: ${userId}`);
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] Target user found: ${targetUser.name} (${targetUser.email})`);

    // Update user role using upsert to handle both insert and update cases
    const { error: updateError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        { 
          user_id: userId, 
          role: role,
          updated_at: new Date().toISOString() 
        },
        { 
          onConflict: 'user_id'
        }
      );

    if (updateError) {
      console.error(`[${requestId}] Failed to update user role:`, updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user role', details: updateError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] User role updated successfully: ${targetUser.name} -> ${role}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User role updated successfully',
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          newRole: role
        }
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
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
