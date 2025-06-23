
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  console.log('[admin-list-users] REQUEST START - Method:', req.method, 'URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[admin-list-users] Handling CORS preflight');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log request details
    console.log('[admin-list-users] Processing request...');
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('[admin-list-users] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('[admin-list-users] Missing authorization header');
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
    
    console.log('[admin-list-users] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[admin-list-users] Missing environment variables');
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
    console.log('[admin-list-users] Verifying token...');
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('[admin-list-users] Auth verification error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed: ' + authError.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!user) {
      console.error('[admin-list-users] No user found from token');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-list-users] User authenticated:', user.id);

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      console.error('[admin-list-users] Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions: ' + roleError.message }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (roleData?.role !== 'administrator') {
      console.error('[admin-list-users] User not admin:', roleData?.role);
      return new Response(
        JSON.stringify({ error: 'Administrator access required. Current role: ' + (roleData?.role || 'unknown') }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-list-users] Admin access confirmed, fetching users...');

    // Use a simplified approach - get profiles directly with role information
    const { data: profilesWithRoles, error: fetchError } = await supabaseAdmin
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
        updated_at,
        user_roles (
          role
        )
      `);
    
    if (fetchError) {
      console.error('[admin-list-users] Failed to fetch profiles:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users: ' + fetchError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-list-users] Profiles fetched:', profilesWithRoles?.length || 0);

    if (!profilesWithRoles || profilesWithRoles.length === 0) {
      console.log('[admin-list-users] No profiles found');
      return new Response(
        JSON.stringify({ users: [], total: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Now get auth users data
    const { data: authUsers, error: authError2 } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError2) {
      console.error('[admin-list-users] Failed to fetch auth users:', authError2);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch auth users: ' + authError2.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-list-users] Auth users fetched:', authUsers.users?.length || 0);

    // Combine profile and auth data
    const combinedUsers = profilesWithRoles.map(profile => {
      const authUser = authUsers.users?.find(au => au.id === profile.id);
      const userRole = Array.isArray(profile.user_roles) 
        ? profile.user_roles[0]?.role 
        : profile.user_roles?.role;
      
      return {
        id: profile.id,
        email: profile.email || authUser?.email || '',
        name: profile.name || authUser?.user_metadata?.name || profile.email || 'Unknown',
        phone: profile.phone || authUser?.user_metadata?.phone || null,
        jobTitle: profile.job_title || null,
        role: userRole || 'servicemedarbejder',
        created_at: authUser?.created_at || profile.created_at,
        updated_at: authUser?.updated_at || profile.updated_at,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        banned_until: authUser?.banned_until || null,
        onLeave: profile.on_leave || false,
        notes: profile.notes || null
      };
    });

    console.log('[admin-list-users] Successfully combined', combinedUsers.length, 'users');
    console.log('[admin-list-users] Sample user data:', combinedUsers[0]);

    return new Response(
      JSON.stringify({ 
        users: combinedUsers,
        total: combinedUsers.length 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[admin-list-users] Unexpected error:', error);
    console.error('[admin-list-users] Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
