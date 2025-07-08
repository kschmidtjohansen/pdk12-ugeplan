import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting demo user creation...');
    
    // Create admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const demoEmail = 'test@polygongroup.com';
    const demoPassword = 'TesterbrugerPlan123';

    console.log('Checking if demo user already exists...');
    
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const existingUser = existingUsers.users.find(user => user.email === demoEmail);
    
    if (existingUser) {
      console.log('Demo user already exists:', existingUser.id);
      
      // Ensure profile exists
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', existingUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking profile:', profileError);
      }

      if (!profile) {
        console.log('Creating missing profile...');
        const { error: profileInsertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: existingUser.id,
            email: demoEmail,
            name: 'Demo User',
            status: 'active',
            job_title: 'System Administrator'
          });

        if (profileInsertError) {
          console.error('Error creating profile:', profileInsertError);
        }
      }

      // Ensure role exists
      const { data: userRole, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (roleError) {
        console.error('Error checking role:', roleError);
      }

      if (!userRole) {
        console.log('Creating missing role...');
        const { error: roleInsertError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: existingUser.id,
            role: 'administrator'
          });

        if (roleInsertError) {
          console.error('Error creating role:', roleInsertError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Demo user already exists and is configured',
          user_id: existingUser.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log('Creating new demo user...');
    
    // Create new user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Demo User'
      },
      app_metadata: {
        is_admin: true
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    if (!newUser.user) {
      throw new Error('User creation failed - no user returned');
    }

    console.log('Demo user created successfully:', newUser.user.id);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: demoEmail,
        name: 'Demo User',
        status: 'active',
        job_title: 'System Administrator'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }

    console.log('Profile created successfully');

    // Create role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'administrator'
      });

    if (roleError) {
      console.error('Error creating role:', roleError);
      throw roleError;
    }

    console.log('Role assigned successfully');

    // Log the creation
    const { error: logError } = await supabaseAdmin
      .from('logs')
      .insert({
        event_type: 'demo_user_created',
        message: 'Demo user created via edge function',
        details: {
          user_id: newUser.user.id,
          email: demoEmail,
          role: 'administrator',
          created_via: 'edge_function'
        }
      });

    if (logError) {
      console.error('Error logging creation:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo user created successfully',
        user_id: newUser.user.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});