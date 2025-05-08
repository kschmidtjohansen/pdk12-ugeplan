
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { UserWithProfile } from "@/types/auth";
import { profileToEmployee } from "@/types/employee";

/**
 * Builds a UserWithProfile object from a Supabase user
 */
export const buildUserWithProfile = async (supabaseUser: any): Promise<UserWithProfile | null> => {
  if (!supabaseUser) return null;
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    
    if (error || !profile) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    const employee = profileToEmployee(profile);
    
    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      phone: employee.phone,
      jobTitle: employee.jobTitle,
      onLeave: employee.onLeave,
      notes: employee.notes
    };
  } catch (error) {
    console.error('Error building user profile:', error);
    return null;
  }
};

/**
 * Log in a user with email and password
 */
export const login = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

/**
 * Sign up a new user with email, password and name
 */
export const signup = async (email: string, password: string, name: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      }
    }
  });
  if (error) throw error;
};

/**
 * Log out the current user
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
};

/**
 * Send a password reset email
 */
export const requestPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  });
  if (error) throw error;
};

/**
 * Reset a user's password
 */
export const resetPassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) throw error;
};

/**
 * Get the current session
 */
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

/**
 * Set up auth state change listener
 */
export const onAuthStateChange = (callback: (session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange((_, session) => {
    callback(session);
  });
};
