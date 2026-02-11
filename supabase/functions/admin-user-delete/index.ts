
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
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

    if (!['administrator', 'super_admin'].includes(userRole?.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId } = await req.json()

    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the deletion attempt
    await supabaseAdmin.rpc('log_security_event_safe', {
      event_type: 'admin_user_delete_attempt',
      event_message: `Admin ${user.email} attempting to delete user ${userId}`,
      event_details: { target_user_id: userId, admin_user_id: user.id },
      severity: 'warning'
    })

    // Delete user from auth.users (this will cascade to related tables)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      
      // Log the failed deletion
      await supabaseAdmin.rpc('log_security_event_safe', {
        event_type: 'admin_user_delete_failed',
        event_message: `Failed to delete user ${userId}: ${deleteError.message}`,
        event_details: { target_user_id: userId, admin_user_id: user.id, error: deleteError.message },
        severity: 'error'
      })

      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log successful deletion
    await supabaseAdmin.rpc('log_security_event_safe', {
      event_type: 'admin_user_delete_success',
      event_message: `User ${userId} successfully deleted by admin ${user.email}`,
      event_details: { target_user_id: userId, admin_user_id: user.id },
      severity: 'info'
    })

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in admin-user-delete function:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
