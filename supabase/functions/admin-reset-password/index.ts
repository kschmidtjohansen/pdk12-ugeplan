
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string, maxRequests = 3, windowMs = 60000): boolean {
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

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' };
  }
  return { valid: true };
}

function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

serve(async (req) => {
  console.log(`[admin-reset-password] ${req.method} request received from ${req.headers.get('origin')}`);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Enhanced origin validation - FIXED: Allow development domains
    const origin = req.headers.get('origin');
    const allowedOrigins = [
      'https://www.pdk12.dk',
      'https://pdk12.dk'
    ];
    
    // Allow localhost, lovable.dev domains, and any development URLs in development
    const isDev = origin?.includes('localhost') || 
                  origin?.includes('lovable.dev') || 
                  origin?.includes('lovableproject.com') ||
                  origin?.includes('127.0.0.1');
    const isAllowedOrigin = allowedOrigins.includes(origin || '') || isDev;
    
    if (!isAllowedOrigin) {
      console.error(`[admin-reset-password] Forbidden origin: ${origin}`);
      return new Response(
        JSON.stringify({ error: 'Origin not allowed' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      console.warn(`[admin-reset-password] Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Too many requests.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[admin-reset-password] Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.substring(7);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('[admin-reset-password] Initializing Supabase client');
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify the user's JWT and check if they're an admin
    console.log('[admin-reset-password] Verifying user token');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('[admin-reset-password] Invalid authentication token:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[admin-reset-password] User verified: ${user.email}`);

    // Check if user is admin
    console.log('[admin-reset-password] Checking user role');
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData || roleData.role !== 'administrator') {
      console.error(`[admin-reset-password] Access denied for user ${user.email}, role: ${roleData?.role}`);
      
      // Log security event
      await supabase.rpc('log_security_event', {
        event_type: 'unauthorized_admin_access',
        event_message: `User ${user.email} attempted unauthorized password reset`,
        event_details: { user_id: user.id, function: 'admin-reset-password' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Insufficient privileges' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-reset-password] Admin access confirmed');

    const { userId, newPassword } = await req.json();

    // Input validation
    if (!userId || !newPassword) {
      console.error('[admin-reset-password] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId and newPassword are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!isValidUuid(userId)) {
      console.error(`[admin-reset-password] Invalid user ID format: ${userId}`);
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      console.error(`[admin-reset-password] Password validation failed: ${passwordValidation.message}`);
      return new Response(
        JSON.stringify({ error: passwordValidation.message || 'Invalid password' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[admin-reset-password] Resetting password for user: ${userId}`);

    // Reset password
    const { error: resetError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (resetError) {
      console.error('[admin-reset-password] Password reset failed:', resetError);
      return new Response(
        JSON.stringify({ error: `Password reset failed: ${resetError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-reset-password] Password reset successful');

    // Log successful password reset
    await supabase.rpc('log_security_event', {
      event_type: 'password_reset',
      event_message: `Admin ${user.email} reset password for user ${userId}`,
      event_details: { 
        admin_id: user.id, 
        target_user_id: userId
      }
    });

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[admin-reset-password] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const statusCode = errorMessage.includes('Insufficient privileges') ? 403 :
                      errorMessage.includes('Rate limit') ? 429 :
                      errorMessage.includes('Invalid') || errorMessage.includes('Missing') || errorMessage.includes('Password must') ? 400 : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
