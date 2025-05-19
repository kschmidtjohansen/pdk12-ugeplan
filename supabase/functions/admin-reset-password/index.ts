
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ResetRequest {
  userId: string;
  newPassword: string;
  email?: string; // Optional email field for recovery flow
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow requests from any origin (will be restricted by Supabase)
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    // Create supabase client with service role key
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    // Parse request body
    const requestBody = await req.json() as ResetRequest;
    console.log("Reset password request received:", {
      ...requestBody,
      newPassword: requestBody.newPassword ? "[REDACTED]" : undefined
    });

    // Handle direct password reset with userId
    if (requestBody.userId && requestBody.newPassword) {
      // Validate password complexity
      if (requestBody.newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check if user exists
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(requestBody.userId);
      
      if (userError || !userData?.user) {
        console.error("User not found:", userError);
        throw new Error('User not found');
      }

      console.log("Updating password for user:", userData.user.id);

      // Use Supabase auth admin API to update the user's password
      const { error } = await supabase.auth.admin.updateUserById(
        requestBody.userId,
        { password: requestBody.newPassword }
      );

      if (error) {
        console.error("Password update error:", error);
        throw error;
      }

      console.log("Password updated successfully");
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
    } 
    // Handle password reset via email
    else if (requestBody.email) {
      console.log("Sending password reset email to:", requestBody.email);
      
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(requestBody.email, {
        redirectTo: `${req.headers.get('origin') || 'https://www.pdk12.dk'}/reset-password`
      });

      if (error) {
        console.error("Password reset email error:", error);
        throw error;
      }

      console.log("Password reset email sent successfully");
      return new Response(
        JSON.stringify({ success: true, message: 'Password reset email sent' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200,
        }
      );
    } 
    else {
      throw new Error('Missing required fields (userId + password or email)');
    }
  } catch (error) {
    console.error('Password reset error:', error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400,
      }
    );
  }
});
