
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1/dist/module';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('User deletion request received from:', req.headers.get('origin'));
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the auth header
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Get the current user's role for authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('User not authenticated');
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.email);

    // Check if user is an administrator
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      console.error('Error fetching user role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user role: ' + roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roleData || roleData.role !== 'administrator') {
      console.error('Unauthorized user attempting deletion:', user.email, 'Role:', roleData?.role);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - requires administrator role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body to get the user ID to delete
    const { userId } = await req.json();
    
    if (!userId) {
      console.error('No user ID provided in request');
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client
    const adminAuthClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    console.log('Starting user deletion process for user:', userId);
    
    // First, delete all related data for the user in order
    try {
      // Delete notifications for the user
      const { error: notificationError } = await adminAuthClient
        .from('notifications')
        .delete()
        .eq('user_id', userId);
        
      if (notificationError) {
        console.error('Error deleting user notifications:', notificationError);
        // Continue with deletion, but log the error
      }
      
      // Delete assignment-employee relationships
      const { error: assignmentEmployeeError } = await adminAuthClient
        .from('assignments_employees')
        .delete()
        .eq('user_id', userId);
        
      if (assignmentEmployeeError) {
        console.error('Error deleting assignment-employee relationships:', assignmentEmployeeError);
        // Continue with deletion, but log the error
      }
      
      // Delete vacation requests
      const { error: vacationError } = await adminAuthClient
        .from('vacations')
        .delete()
        .eq('user_id', userId);
        
      if (vacationError) {
        console.error('Error deleting vacation requests:', vacationError);
        // Continue with deletion, but log the error
      }
      
      // Delete user role
      const { error: roleDeleteError } = await adminAuthClient
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
        
      if (roleDeleteError) {
        console.error('Error deleting user role:', roleDeleteError);
        // Continue with deletion, but log the error
      }
      
      // Delete profile
      const { error: profileError } = await adminAuthClient
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (profileError) {
        console.error('Error deleting user profile:', profileError);
        // Continue with deletion, but log the error
      }
      
      console.log('Successfully deleted all related data for user:', userId);
      
    } catch (dataDeleteError) {
      console.error('Error during data deletion:', dataDeleteError);
      // Continue with auth user deletion even if some data deletion failed
    }
    
    // Finally, delete the auth user
    const { error: authDeleteError } = await adminAuthClient.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      throw new Error(`Failed to delete user from auth: ${authDeleteError.message}`);
    }
    
    console.log('Successfully deleted auth user:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('User deletion error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred during user deletion',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
