
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RoleUpdateRequest {
  userId: string;
  role: string;
}

// Enhanced CORS configuration for development and production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins for development
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(clientId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  const allowedOrigins = [
    'https://www.pdk12.dk',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080'
  ];
  
  // Allow Lovable development domains
  if (origin.includes('lovable.dev') || origin.includes('lovableproject.com')) {
    return true;
  }
  
  return allowedOrigins.includes(origin);
}

serve(async (req) => {
  console.log('[admin-user-role] Request received:', req.method);
  console.log('[admin-user-role] Request origin:', req.headers.get('origin'));
  console.log('[admin-user-role] User-Agent:', req.headers.get('user-agent'));

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('[admin-user-role] Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Enhanced origin verification
    const origin = req.headers.get('origin');
    console.log('[admin-user-role] Checking origin:', origin);
    
    if (!isAllowedOrigin(origin)) {
      console.warn('[admin-user-role] Origin not allowed:', origin);
      // For development, we'll be more permissive
      if (!origin?.includes('localhost') && !origin?.includes('127.0.0.1') && !origin?.includes('lovable')) {
        return new Response(
          JSON.stringify({ 
            error: 'Origin not allowed', 
            debug: { origin, allowed: false }
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    console.log('[admin-user-role] Client IP:', clientIp);
    
    if (!checkRateLimit(clientIp)) {
      console.warn('[admin-user-role] Rate limit exceeded for IP:', clientIp);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Too many requests.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get auth credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('[admin-user-role] Supabase URL configured:', !!supabaseUrl);
    console.log('[admin-user-role] Service key configured:', !!supabaseServiceKey);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[admin-user-role] Missing Supabase credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          debug: { hasUrl: !!supabaseUrl, hasServiceKey: !!supabaseServiceKey }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    console.log('[admin-user-role] Auth header present:', !!authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[admin-user-role] Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ 
          error: 'Missing or invalid authorization header',
          debug: { hasAuth: !!authHeader, format: authHeader?.substring(0, 10) }
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.substring(7);
    
    // Create supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT and check if they're an admin
    console.log('[admin-user-role] Verifying user token...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[admin-user-role] Invalid authentication token:', userError?.message);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authentication token',
          debug: { userError: userError?.message }
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-user-role] Authenticated user:', user.email);

    // Check if user is an administrator
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData || roleData.role !== 'administrator') {
      console.error('[admin-user-role] Insufficient privileges for user:', user.email, 'Role:', roleData?.role);
      
      // Log security event
      await supabase.rpc('log_security_event', {
        event_type: 'unauthorized_role_update_attempt',
        event_message: `User ${user.email} attempted unauthorized role update`,
        event_details: { user_id: user.id, function: 'admin-user-role' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Insufficient privileges - requires administrator role' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    console.log('[admin-user-role] Request body received:', {
      hasUserId: !!requestBody.userId,
      hasRole: !!requestBody.role,
      userId: requestBody.userId,
      role: requestBody.role
    });

    const { userId, role } = requestBody as RoleUpdateRequest;

    if (!userId || !role) {
      console.error('[admin-user-role] Missing required fields:', {
        hasUserId: !!userId,
        hasRole: !!role
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: userId and role are required',
          debug: { hasUserId: !!userId, hasRole: !!role }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate role is one of the expected values
    const validRoles = ['administrator', 'skadeleder', 'servicemedarbejder'];
    if (!validRoles.includes(role)) {
      console.error('[admin-user-role] Invalid role specified:', role);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid role specified',
          debug: { providedRole: role, validRoles }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-user-role] Updating user role:', { userId, role });

    // Update user role in the database
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[admin-user-role] Database update error:', updateError);
      
      // Handle specific database errors
      if (updateError.message?.includes('permission denied')) {
        return new Response(
          JSON.stringify({ error: 'Database permission denied' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (updateError.message?.includes('not found')) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update user role',
          debug: { databaseError: updateError.message }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-user-role] Role update successful');

    // Log successful role update
    await supabase.rpc('log_security_event', {
      event_type: 'user_role_updated',
      event_message: `Admin ${user.email} updated user ${userId} role to ${role}`,
      event_details: { 
        admin_id: user.id, 
        target_user_id: userId,
        new_role: role 
      }
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[admin-user-role] Unexpected error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        debug: { 
          stack: error instanceof Error ? error.stack : undefined,
          type: typeof error
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500,
      }
    );
  }
});
