
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

    if (roleError || !['administrator', 'super_admin'].includes(roleData?.role)) {
      console.error(`[${requestId}] User not admin. Role: ${roleData?.role}, User: ${user.email}`);
      return new Response(
        JSON.stringify({ error: 'Administrator access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { email, password, name, role, userData } = await req.json();
    
    const isTemporary = userData?.is_temporary || false;

    // Validate required fields based on user type
    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!isTemporary && (!email || !password)) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required for non-temporary users' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] Creating user - temporary: ${isTemporary}, email: ${email || 'none'}, name: ${name}, role: ${role}`);

    let userId: string;
    let finalEmail: string;
    
    if (isTemporary) {
      // For temporary users, generate UUID and temporary email
      userId = crypto.randomUUID();
      finalEmail = email || `vikar-${Date.now()}-${userId.substring(0, 8)}@temp.local`;
      console.log(`[${requestId}] Generated UUID for temporary user: ${userId}, temp email: ${finalEmail}`);
    } else {
      finalEmail = email;
    }
    
    // Create the user in auth for both regular and temporary users
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: finalEmail,
      password: isTemporary ? crypto.randomUUID() : password, // Random password for temporary users
      email_confirm: true,
      user_metadata: { 
        name,
        phone: userData?.phone,
        job_title: userData?.job_title,
        is_temporary: isTemporary
      }
    });

    if (createError) {
      console.error(`[${requestId}] User creation error:`, createError);
      return new Response(
        JSON.stringify({ error: `User creation failed: ${createError.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!newUser.user?.id) {
      console.error(`[${requestId}] No user ID returned from auth creation`);
      return new Response(
        JSON.stringify({ error: 'User creation failed: No user ID returned' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Use the auth-generated user ID for consistency
    userId = newUser.user.id;
    console.log(`[${requestId}] User created:`, { userId, email: finalEmail, temporary: isTemporary });

    // Create profile entry
    if (userId) {
      // Enhanced phone validation using the same logic as frontend
      let sanitizedPhone = null;
      if (userData?.phone && typeof userData.phone === 'string') {
        const trimmed = userData.phone.trim();
        
        // Skip empty or very short values
        if (!trimmed || trimmed.length < 3) {
          sanitizedPhone = null;
        } else {
          // Validate against database constraint pattern: ^\+?[0-9\s\-\(\)]{8,}$
          const phonePattern = /^\+?[0-9\s\-\(\)]{8,}$/;
          if (phonePattern.test(trimmed)) {
            sanitizedPhone = trimmed;
          } else {
            console.error(`[admin-create-user] Invalid phone format: "${trimmed}"`);
            // Return error instead of proceeding with invalid phone
            return new Response(
              JSON.stringify({ 
                error: 'Phone number format is invalid. Use only numbers, spaces, dashes, parentheses, and optional + prefix (minimum 8 characters)' 
              }),
              { status: 400, headers: corsHeaders }
            );
          }
        }
      }
      
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          name: name,
          email: finalEmail,
          phone: sanitizedPhone,
          job_title: userData?.job_title || null,
          status: 'active',
          is_temporary: userData?.is_temporary || false,
          expires_at: userData?.is_temporary && userData?.expires_at ? userData.expires_at : null,
          has_asbestos_certificate: !!userData?.has_asbestos_certificate,
          has_trailer_license: !!userData?.has_trailer_license,
          has_forklift_license: !!userData?.has_forklift_license,
          home_postcode: userData?.home_postcode || null,
          home_address: userData?.home_address || null,
          lat: userData?.lat || null,
          lng: userData?.lng || null,
        });

      if (profileError) {
        console.error(`[${requestId}] Profile creation error:`, profileError);
        
        // Check if it's a phone format constraint violation
        if (profileError.message?.includes('check_phone_format') || profileError.code === '23514') {
          return new Response(
            JSON.stringify({ 
              error: 'Phone number format is invalid. Please use a valid phone number format.' 
            }),
            { status: 400, headers: corsHeaders }
          );
        }
        
        // For other profile errors, don't fail completely - the user was created
        console.log(`[${requestId}] User created but profile update failed, continuing...`);
      }

      // Create user role entry
      if (role) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role: role
          });

        if (roleError) {
          console.error(`[${requestId}] Role assignment error:`, roleError);
          
          // Check for duplicate role assignment (user might already have a role)
          if (roleError.code === '23505') {
            console.log(`[${requestId}] User already has role assignment, updating instead...`);
            // Try to update the existing role
            const { error: updateRoleError } = await supabaseAdmin
              .from('user_roles')
              .update({ role })
              .eq('user_id', userId);
              
            if (updateRoleError) {
              console.error(`[${requestId}] Role update also failed:`, updateRoleError);
            } else {
              console.log(`[${requestId}] Role updated successfully`);
            }
          } else {
            // Don't fail completely for other role assignment errors
            console.log(`[${requestId}] User and profile created but role assignment failed`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        id: userId,
        user: { id: userId },
        message: 'User created successfully',
        temporary: isTemporary
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
        requestId
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
