
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  console.log('[admin-list-users] FIXED - Request received:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[admin-list-users] FIXED - Handling CORS preflight');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // FIXED: Get the authorization header with detailed logging
    const authHeader = req.headers.get('Authorization');
    console.log('[admin-list-users] FIXED - Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('[admin-list-users] FIXED - Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // FIXED: Create admin Supabase client with enhanced error handling
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('[admin-list-users] FIXED - Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[admin-list-users] FIXED - Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // FIXED: Verify the current user is authenticated with better error handling
    const token = authHeader.replace('Bearer ', '');
    console.log('[admin-list-users] FIXED - Verifying token...');
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('[admin-list-users] FIXED - Auth verification error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed: ' + authError.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!user) {
      console.error('[admin-list-users] FIXED - No user found from token');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-list-users] FIXED - User authenticated:', user.id);

    // FIXED: Check if user has admin role with enhanced error handling
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      console.error('[admin-list-users] FIXED - Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions: ' + roleError.message }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (roleData?.role !== 'administrator') {
      console.error('[admin-list-users] FIXED - User not admin:', roleData?.role);
      return new Response(
        JSON.stringify({ error: 'Administrator access required. Current role: ' + (roleData?.role || 'unknown') }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-list-users] FIXED - Admin access confirmed, fetching users...');

    // FIXED: Fetch all users from auth.users with enhanced error handling
    const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('[admin-list-users] FIXED - Failed to fetch auth users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users from auth: ' + usersError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-list-users] FIXED - Auth users fetched:', authUsers.users?.length || 0);

    if (!authUsers.users || authUsers.users.length === 0) {
      console.log('[admin-list-users] FIXED - No users found in auth');
      return new Response(
        JSON.stringify({ users: [] }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // FIXED: Get user IDs for profile and role lookup
    const userIds = authUsers.users.map(u => u.id);
    console.log('[admin-list-users] FIXED - Fetching profiles and roles for', userIds.length, 'users');

    // FIXED: Fetch profiles with error handling
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, phone, job_title, on_leave, notes')
      .in('id', userIds);

    if (profilesError) {
      console.error('[admin-list-users] FIXED - Profiles fetch error:', profilesError);
      // Continue without profiles rather than failing completely
    }

    console.log('[admin-list-users] FIXED - Profiles fetched:', profiles?.length || 0);

    // FIXED: Fetch user roles with error handling
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    if (rolesError) {
      console.error('[admin-list-users] FIXED - User roles fetch error:', rolesError);
      // Continue without roles rather than failing completely
    }

    console.log('[admin-list-users] FIXED - User roles fetched:', userRoles?.length || 0);

    // FIXED: Combine auth users with profiles and roles
    const combinedUsers = authUsers.users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id);
      const roleData = userRoles?.find(r => r.user_id === authUser.id);
      
      return {
        id: authUser.id,
        email: authUser.email || profile?.email || '',
        name: profile?.name || authUser.user_metadata?.name || authUser.email || 'Unknown',
        phone: profile?.phone || authUser.user_metadata?.phone || null,
        jobTitle: profile?.job_title || null,
        role: roleData?.role || 'servicemedarbejder',
        created_at: authUser.created_at,
        updated_at: authUser.updated_at,
        last_sign_in_at: authUser.last_sign_in_at,
        banned_until: authUser.banned_until,
        onLeave: profile?.on_leave || false,
        notes: profile?.notes || null
      };
    });

    console.log('[admin-list-users] FIXED - Successfully combined', combinedUsers.length, 'users');

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
    console.error('[admin-list-users] FIXED - Unexpected error:', error);
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
