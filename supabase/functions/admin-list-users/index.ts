
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'administrator') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all users with their profiles and roles
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        name,
        email,
        phone,
        job_title,
        avatar_url
      `)
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }
    
    // Get user roles
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
        
    if (rolesError) {
      console.error('Error fetching roles:', rolesError)
      throw rolesError
    }
    
    // Get auth user data to check banned_until status
    const { data: authResponse, error: authListError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authListError) {
      console.error('Error fetching auth users:', authListError)
      // Continue without auth data rather than failing completely
    }
    
    // Combine the data
    const combinedUsers = profilesData.map(profile => {
      const userRole = rolesData.find(r => r.user_id === profile.id)
      const authUser = authResponse?.users?.find(user => user.id === profile.id)
      
      // Helper function to extract banned_until from various sources
      const getBannedUntil = (authUserData: any): string | null => {
        if (!authUserData) return null
        
        // Check direct property first
        if (authUserData.banned_until) return authUserData.banned_until
        
        // Check user_metadata
        if (authUserData.user_metadata?.banned_until) return authUserData.user_metadata.banned_until
        
        // Check app_metadata
        if (authUserData.app_metadata?.banned_until) return authUserData.app_metadata.banned_until
        
        return null
      }

      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        jobTitle: profile.job_title || '',
        role: (userRole?.role || 'servicemedarbejder'),
        banned_until: getBannedUntil(authUser),
        avatar_url: profile.avatar_url
      }
    })

    return new Response(
      JSON.stringify({ users: combinedUsers }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in admin-list-users function:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
