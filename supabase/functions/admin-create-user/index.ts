
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Enhanced CORS configuration for development and production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins for development
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string, maxRequests = 5, windowMs = 60000): boolean {
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

function validateEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  console.log('[admin-create-user] Validating password requirements');
  
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  
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

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char];
    })
    .trim()
    .substring(0, 1000); // Limit input length
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
  console.log('[admin-create-user] Request received:', req.method);
  console.log('[admin-create-user] Request origin:', req.headers.get('origin'));
  console.log('[admin-create-user] User-Agent:', req.headers.get('user-agent'));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[admin-create-user] Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Enhanced origin verification
    const origin = req.headers.get('origin');
    console.log('[admin-create-user] Checking origin:', origin);
    
    if (!isAllowedOrigin(origin)) {
      console.warn('[admin-create-user] Origin not allowed:', origin);
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
    console.log('[admin-create-user] Client IP:', clientIp);
    
    if (!checkRateLimit(clientIp)) {
      console.warn('[admin-create-user] Rate limit exceeded for IP:', clientIp);
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
    console.log('[admin-create-user] Auth header present:', !!authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[admin-create-user] Missing or invalid authorization header');
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('[admin-create-user] Supabase URL configured:', !!supabaseUrl);
    console.log('[admin-create-user] Service key configured:', !!serviceKey);
    
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify the user's JWT and check if they're an admin
    console.log('[admin-create-user] Verifying user token...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[admin-create-user] Invalid authentication token:', userError?.message);
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

    console.log('[admin-create-user] Authenticated user:', user.email);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData || roleData.role !== 'administrator') {
      console.error('[admin-create-user] Insufficient privileges for user:', user.email, 'Role:', roleData?.role);
      
      // Log security event
      await supabase.rpc('log_security_event', {
        event_type: 'unauthorized_admin_access',
        event_message: `User ${user.email} attempted unauthorized admin function access`,
        event_details: { user_id: user.id, function: 'admin-create-user' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Insufficient privileges' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestBody = await req.json();
    console.log('[admin-create-user] Request body received:', {
      hasEmail: !!requestBody.email,
      hasPassword: !!requestBody.password,
      hasUserData: !!requestBody.userData,
      userData: requestBody.userData
    });

    const { email, password, userData } = requestBody;

    // Input validation
    if (!email || !password || !userData?.name) {
      console.error('[admin-create-user] Missing required fields:', {
        hasEmail: !!email,
        hasPassword: !!password,
        hasName: !!userData?.name
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: email, password, and name are required',
          debug: { hasEmail: !!email, hasPassword: !!password, hasName: !!userData?.name }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!validateEmail(email)) {
      console.error('[admin-create-user] Invalid email format:', email);
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.error('[admin-create-user] Password validation failed:', passwordValidation.message);
      return new Response(
        JSON.stringify({ error: passwordValidation.message || 'Invalid password' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    const sanitizedName = sanitizeInput(userData.name);

    console.log('[admin-create-user] Creating user with sanitized data:', {
      email: sanitizedEmail,
      name: sanitizedName
    });

    // Create user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: sanitizedEmail,
      password: password,
      user_metadata: { name: sanitizedName },
      email_confirm: true
    });

    if (createError) {
      console.error('[admin-create-user] User creation error:', createError);
      
      // Map Supabase errors to user-friendly messages
      if (createError.message?.includes('User already registered')) {
        return new Response(
          JSON.stringify({ error: 'A user with this email already exists' }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (createError.message?.includes('Invalid email')) {
        return new Response(
          JSON.stringify({ error: 'Please enter a valid email address' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (createError.message?.includes('Password')) {
        return new Response(
          JSON.stringify({ error: 'Password does not meet requirements' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create user', 
          debug: { supabaseError: createError.message }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!newUser.user) {
      console.error('[admin-create-user] No user data returned from creation');
      return new Response(
        JSON.stringify({ error: 'Failed to create user - no user data returned' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-create-user] User created successfully:', newUser.user.id);

    // Log successful user creation
    await supabase.rpc('log_security_event', {
      event_type: 'user_created',
      event_message: `Admin ${user.email} created new user ${sanitizedEmail}`,
      event_details: { 
        admin_id: user.id, 
        new_user_id: newUser.user.id,
        new_user_email: sanitizedEmail 
      }
    });

    return new Response(
      JSON.stringify({ user: newUser.user }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[admin-create-user] Unexpected error:', error);
    
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
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
