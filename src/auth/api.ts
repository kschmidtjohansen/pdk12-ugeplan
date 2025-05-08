
import { supabase } from "../lib/supabase";
import { User, UserRole } from "./types";
import { toast } from "@/components/ui/use-toast";

// Helper to fetch user profile
export const fetchUserProfile = async (authUser: any): Promise<{ user: User | null, error: string | null }> => {
  try {
    console.log('Fetching user profile for:', authUser.id);
    
    // Get user profile from users table
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return { 
        user: null, 
        error: `Failed to fetch user profile: ${error.message}` 
      };
    }
    
    if (profile) {
      console.log('User profile fetched successfully:', profile);
      return {
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as UserRole,
          phone: profile.phone,
          jobTitle: profile.job_title
        },
        error: null
      };
    } else {
      console.error('No user profile found:', authUser.id);
      return { 
        user: null, 
        error: 'User profile not found. Please contact support.'
      };
    }
  } catch (error: any) {
    console.error('Error in fetchUserProfile:', error);
    return { 
      user: null, 
      error: 'An unexpected error occurred while fetching your profile.' 
    };
  }
};

// Login function
export const loginUser = async (email: string, password: string) => {
  try {
    console.log('Attempting login for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login error:', error);
      throw error;
    }
    
    console.log('Login successful, session created:', data.session?.user?.id);
    return data;
  } catch (error) {
    throw error;
  }
};

// Logout function
export const logoutUser = async () => {
  try {
    console.log('Logging out user');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Password reset request function
export const requestPasswordReset = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
};

// Reset password function
export const resetPassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
};
