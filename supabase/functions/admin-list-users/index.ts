
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  // Accept both GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
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
    console.log(`[${requestId}] Processing ${req.method} request...`);
    
    // Get authorization header
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
      urlPrefix: supabaseUrl?.substring(0, 20) + '...',
      keyPrefix: supabaseServiceKey?.substring(0, 10) + '...'
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

    // Verify the current user is authenticated
    const token = authHeader.replace('Bearer ', '');
    console.log(`[${requestId}] Verifying token (length: ${token.length})`);
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error(`[${requestId}] Auth verification error:`, authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed: ' + authError.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!user) {
      console.error(`[${requestId}] No user found from token`);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] User authenticated: ${user.id} (${user.email})`);

    // FIXED: Check if user has admin OR skadeleder role with better error handling
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors

    if (roleError) {
      console.error(`[${requestId}] Role check error:`, roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions: ' + roleError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // FIXED: Better handling when no role is found
    if (!roleData || !roleData.role) {
      console.error(`[${requestId}] No role found for user: ${user.email}`);
      return new Response(
        JSON.stringify({ 
          error: 'No role assigned to user. Please contact administrator.',
          userEmail: user.email
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // FIXED: Allow both administrator and skadeleder roles
    if (!['administrator', 'skadeleder'].includes(roleData.role)) {
      console.error(`[${requestId}] User not authorized. Role: ${roleData.role}, User: ${user.email}`);
      return new Response(
        JSON.stringify({ 
          error: 'Administrator or Skadeleder access required. Current role: ' + roleData.role,
          allowedRoles: ['administrator', 'skadeleder'],
          currentRole: roleData.role
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] Access granted for role: ${roleData.role} (${user.email}), fetching users...`);

    // FIXED: Get profiles and roles separately to avoid JOIN issues
    console.log(`[${requestId}] Fetching profiles...`);
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        name,
        email,
        phone,
        job_title,
        on_leave,
        notes,
        created_at,
        updated_at
      `);

    if (profilesError) {
      console.error(`[${requestId}] Failed to fetch profiles:`, profilesError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch profiles: ' + profilesError.message,
          requestId,
          details: profilesError
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch user roles separately
    console.log(`[${requestId}] Fetching user roles...`);
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role');
    
    if (rolesError) {
      console.error(`[${requestId}] Failed to fetch user roles:`, rolesError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch user roles: ' + rolesError.message,
          requestId,
          details: rolesError
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] Fetched ${profiles?.length || 0} profiles and ${userRoles?.length || 0} role assignments`);

    if (!profiles || profiles.length === 0) {
      console.log(`[${requestId}] No profiles found`);
      return new Response(
        JSON.stringify({ 
          users: [],
          total: 0,
          debug: {
            requestId,
            message: "No profiles found in database",
            timestamp: new Date().toISOString()
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create role lookup map for better performance
    const roleMap = new Map();
    userRoles?.forEach(role => {
      roleMap.set(role.user_id, role.role);
    });

    // Get auth users data for additional info
    const { data: authUsers, error: authError2 } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError2) {
      console.error(`[${requestId}] Failed to fetch auth users:`, authError2);
      // Continue without auth data instead of failing completely
      console.log(`[${requestId}] Continuing without auth user data`);
    }

    console.log(`[${requestId}] Auth users fetched: ${authUsers?.users?.length || 0}`);

    // FIXED: Combine profiles with roles using the role map
    const combinedUsers = profiles.map(profile => {
      const authUser = authUsers?.users?.find(au => au.id === profile.id);
      
      // Get role from the role map, default to servicemedarbejder
      const userRole = roleMap.get(profile.id) || 'servicemedarbejder';
      
      return {
        id: profile.id,
        email: profile.email || authUser?.email || '',
        name: profile.name || authUser?.user_metadata?.name || profile.email || 'Unknown',
        phone: profile.phone || authUser?.user_metadata?.phone || null,
        jobTitle: profile.job_title || null,
        role: userRole,
        created_at: authUser?.created_at || profile.created_at,
        updated_at: authUser?.updated_at || profile.updated_at,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        banned_until: authUser?.banned_until || null,
        onLeave: profile.on_leave || false,
        notes: profile.notes || null
      };
    });

    // FIXED: Calculate role statistics for debugging
    const roleStats = combinedUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eligibleCount = (roleStats.administrator || 0) + (roleStats.skadeleder || 0);

    console.log(`[${requestId}] SUCCESS - Combined ${combinedUsers.length} users`);
    console.log(`[${requestId}] Role distribution:`, roleStats);
    console.log(`[${requestId}] Eligible users (admin + skadeleder): ${eligibleCount}`);

    return new Response(
      JSON.stringify({ 
        users: combinedUsers,
        total: combinedUsers.length,
        debug: {
          requestId,
          method: req.method,
          profileCount: profiles.length,
          authUserCount: authUsers?.users?.length || 0,
          roleDistribution: roleStats,
          eligibleUsers: eligibleCount,
          requestTime: new Date().toISOString(),
          accessGrantedForRole: roleData.role
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    console.error(`[${requestId}] Error stack:`, error.stack);
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
