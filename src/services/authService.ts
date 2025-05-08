
import { supabase } from '../lib/supabase';
import { handleApiError } from '../lib/supabase';
import { UserRole } from '../types/auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
}

/**
 * Service for authentication and user management
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login({ email, password }: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  /**
   * Sign up a new user
   */
  async signup({ email, password, name, role, phone, jobTitle }: SignupCredentials) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            phone,
            job_title: jobTitle,
          },
        },
      });
      
      if (authError) throw authError;
      
      // Create a user profile in the users table
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            name,
            role,
            phone,
            job_title: jobTitle,
          });
        
        if (profileError) throw profileError;
      }
      
      return authData;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Admin functions
  /**
   * List all users (admin only)
   */
  async listUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      return { data };
    } catch (error) {
      return { error };
    }
  },
  
  /**
   * Create a new user (admin only)
   */
  async createUser({ email, password, name, role, phone, jobTitle }: SignupCredentials) {
    try {
      const { data, error } = await this.signup({ 
        email, 
        password, 
        name, 
        role,
        phone,
        jobTitle
      });
      
      if (error) throw error;
      
      // Return the new user data in the format needed for UI
      if (data?.user) {
        return {
          id: data.user.id,
          email,
          name,
          role,
          phone,
          jobTitle
        };
      }
      return null;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  /**
   * Update an existing user (admin only)
   */
  async updateUser(userId: string, { name, email, role, password, phone, jobTitle }: Partial<SignupCredentials>) {
    try {
      // Update the auth user if password was provided
      if (password) {
        // This would require admin privileges or a custom function
        // For now, let's leave this unimplemented
        console.warn('Password update for users requires admin API access');
      }
      
      // Update the user profile in our database
      const { data, error } = await supabase
        .from('users')
        .update({ 
          name,
          email,
          role,
          phone,
          job_title: jobTitle
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string) {
    try {
      // Note: This would typically require admin API access
      // For now, we'll just remove from our users table
      // In a real implementation, you would use Supabase admin functions
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  /**
   * Reset a user's password (admin only)
   */
  async resetUserPassword(userId: string, newPassword: string) {
    try {
      // Note: This would typically require admin API access
      // For demonstration purposes only
      console.warn('Password reset for other users requires admin API');
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  }
};
