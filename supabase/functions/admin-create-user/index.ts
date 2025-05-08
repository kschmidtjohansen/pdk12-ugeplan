
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase SERVICE ROLE KEY - env var exported by default
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      // Create client with Auth context of the server
      { global: { headers: { Authorization: authorization } } }
    );

    // Get request body
    const { formData } = await req.json();

    // Validate required fields
    if (!formData.email || !formData.name) {
      return new Response(
        JSON.stringify({ error: "Email and name are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user with admin API
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: formData.email,
      email_confirm: true,
      password: 'tempPassword' + Math.random().toString(36).substring(2, 10),
      user_metadata: {
        name: formData.name
      }
    });

    if (authError) {
      console.error("Error creating user:", authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // Update profile with additional data
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        job_title: formData.jobTitle || null,
        role: formData.role,
        on_leave: formData.onLeave || false,
        notes: formData.notes || null
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      
      // Attempt to clean up by deleting the user if profile update fails
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      
      throw profileError;
    }

    // Return the new employee data
    return new Response(
      JSON.stringify({
        id: authData.user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        jobTitle: formData.jobTitle,
        role: formData.role,
        onLeave: formData.onLeave,
        notes: formData.notes
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Admin create user error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create user" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
