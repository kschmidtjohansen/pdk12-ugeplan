import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Enhanced CORS headers with additional security
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
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

function sanitizeInput(input: string): string {
  return input.replace(/[<>'"]/g, '');
}

serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[admin-reset-password:${requestId}] ${req.method} request received`);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Enhanced origin validation with stricter checks
    const origin = req.headers.get('origin');
    
    const allowedOrigins = [
      'https://www.pdk12.dk',
      'https://pdk12.dk'
    ];
    
    const isDev = origin?.includes('localhost') || 
                  origin?.includes('lovable.dev') || 
                  origin?.includes('lovableproject.com') ||
                  origin?.includes('lovable.app') ||
                  origin?.includes('127.0.0.1');
    const isAllowedOrigin = allowedOrigins.includes(origin || '') || isDev;
    
    if (!isAllowedOrigin) {
      console.error(`[admin-reset-password:${requestId}] Forbidden origin`);
      return new Response(
        JSON.stringify({ error: 'Origin not allowed' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Enhanced rate limiting with IP tracking
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIp)) {
      console.warn(`[admin-reset-password:${requestId}] Rate limit exceeded`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Too many requests.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // ─── MANUAL JWT VALIDATION ───────────────────────────────────────
    // This function has verify_jwt = false in config.toml because it
    // performs manual JWT validation below. The manual flow is:
    //   1. Extract Bearer token from Authorization header
    //   2. Validate token format (3-part JWT structure)
    //   3. Create anon Supabase client with user's token
    //   4. Call supabase.auth.getUser() to verify token server-side
    //   5. Check user_roles table for administrator/super_admin role
    // Do NOT enable verify_jwt without removing this manual validation.
    // ─────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error(`[admin-reset-password:${requestId}] Missing or invalid authorization header`);
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.substring(7);
    
    // Validate token format (basic JWT structure check)
    if (token.split('.').length !== 3) {
      console.error(`[admin-reset-password:${requestId}] Invalid token format`);
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create two Supabase clients
    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Client-Info': 'admin-reset-password-function'
        }
      }
    });
    
    const supabaseService = createClient(supabaseUrl, serviceKey, {
      global: {
        headers: {
          'X-Client-Info': 'admin-reset-password-service'
        }
      }
    });

    // Verify the user's JWT using the anon client
    console.log(`[admin-reset-password:${requestId}] Verifying user token`);
    
    try {
      const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
      
      if (userError || !user) {
        console.error(`[admin-reset-password:${requestId}] Invalid authentication token`);
        return new Response(
          JSON.stringify({ error: 'Invalid authentication token' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`[admin-reset-password:${requestId}] User verified, checking role`);

      // Check if user is admin using the anon client (RLS will handle access control)
      // NOTE: users can have multiple roles — never use .single() here
      const { data: roleRows, error: roleError } = await supabaseAnon
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roles = (roleRows || []).map((r: { role: string }) => r.role);
      const isAdmin = roles.some((r) => ['administrator', 'super_admin'].includes(r));

      if (roleError || !isAdmin) {
        console.error(`[admin-reset-password:${requestId}] Access denied - insufficient role`);
        
        // Log security event using service client
        try {
          await supabaseService.rpc('log_security_event_safe', {
            event_type: 'unauthorized_admin_access',
            event_message: 'Unauthorized password reset attempt',
            event_details: { user_id: user.id, function: 'admin-reset-password', ip: clientIp },
            severity: 'warning'
          });
        } catch (logError) {
          console.warn(`[admin-reset-password:${requestId}] Failed to log security event`);
        }
        
        return new Response(
          JSON.stringify({ error: 'Insufficient privileges' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`[admin-reset-password:${requestId}] Admin access confirmed`);

      // Parse request body with enhanced validation
      let requestBody;
      try {
        requestBody = await req.json();
      } catch (parseError) {
        console.error(`[admin-reset-password:${requestId}] Failed to parse request body`);
        return new Response(
          JSON.stringify({ error: 'Invalid request body' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      let { userId, newPassword } = requestBody;

      // Enhanced input validation and sanitization
      if (!userId || !newPassword) {
        console.error(`[admin-reset-password:${requestId}] Missing required fields`);
        return new Response(
          JSON.stringify({ error: 'Missing required fields: userId and newPassword are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Sanitize inputs
      userId = sanitizeInput(userId);
      
      if (!isValidUuid(userId)) {
        console.error(`[admin-reset-password:${requestId}] Invalid user ID format`);
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
        console.error(`[admin-reset-password:${requestId}] Password validation failed`);
        return new Response(
          JSON.stringify({ error: passwordValidation.message || 'Invalid password' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`[admin-reset-password:${requestId}] Resetting password for target user`);

      // Reset password using service role client
      const { error: resetError } = await supabaseService.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (resetError) {
        console.error(`[admin-reset-password:${requestId}] Password reset failed:`, resetError.message);
        return new Response(
          JSON.stringify({ error: `Password reset failed: ${resetError.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`[admin-reset-password:${requestId}] Password reset successful`);

      // Log successful password reset (without sensitive data)
      try {
        await supabaseService.rpc('log_security_event_safe', {
          event_type: 'password_reset',
          event_message: 'Admin password reset completed',
          event_details: { 
            admin_id: user.id, 
            target_user_id: userId,
            request_id: requestId
          },
          severity: 'info'
        });
      } catch (logError) {
        console.warn(`[admin-reset-password:${requestId}] Failed to log password reset event`);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (authError) {
      console.error(`[admin-reset-password:${requestId}] Authentication error`);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error(`[admin-reset-password:${requestId}] Unexpected error`);
    
    const statusCode = 500;

    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})