
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.pdk12.dk',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST',
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

serve(async (req) => {
  console.log('[admin-create-user] Request received:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify origin
    const origin = req.headers.get('origin');
    console.log('[admin-create-user] Request origin:', origin);
    
    if (origin !== 'https://www.pdk12.dk' && !origin?.includes('lovable.dev')) {
      console.error('[admin-create-user] Forbidden origin:', origin);
      throw new Error('Forbidden origin');
    }

    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
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
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[admin-create-user] Missing or invalid authorization header');
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify the user's JWT and check if they're an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('[admin-create-user] Invalid authentication token:', userError);
      throw new Error('Invalid authentication token');
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
      throw new Error('Missing required fields: email, password, and name are required');
    }

    if (!validateEmail(email)) {
      console.error('[admin-create-user] Invalid email format:', email);
      throw new Error('Invalid email format');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.error('[admin-create-user] Password validation failed:', passwordValidation.message);
      throw new Error(passwordValidation.message || 'Invalid password');
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
        throw new Error('A user with this email already exists');
      } else if (createError.message?.includes('Invalid email')) {
        throw new Error('Please enter a valid email address');
      } else if (createError.message?.includes('Password')) {
        throw new Error('Password does not meet requirements');
      }
      
      throw createError;
    }

    if (!newUser.user) {
      console.error('[admin-create-user] No user data returned from creation');
      throw new Error('Failed to create user - no user data returned');
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
    console.error('[admin-create-user] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const statusCode = errorMessage.includes('Insufficient privileges') ? 403 :
                      errorMessage.includes('Rate limit') ? 429 :
                      errorMessage.includes('already exists') ? 409 :
                      errorMessage.includes('Invalid') || errorMessage.includes('required') ? 400 : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
