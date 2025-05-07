
import { supabase, handleApiError } from '../lib/supabase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name: string;
  role: 'administrator' | 'skadeleder' | 'servicemedarbejder';
}

export const authService = {
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
  
  async signup({ email, password, name, role }: SignupCredentials) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
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
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};
