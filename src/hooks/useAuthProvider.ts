
import { useState, useEffect } from "react";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { User, UserRole } from "../types/auth";

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  // Helper to fetch user profile
  const fetchAndSetUserProfile = async (authUser: SupabaseUser) => {
    try {
      setIsLoading(true);
      // Get user profile from users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        setIsLoading(false);
        return;
      }
      
      if (profile) {
        console.log('User profile fetched:', profile);
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as UserRole,
          phone: profile.phone,
          jobTitle: profile.job_title
        });
      } else {
        console.error('No user profile found:', authUser.id);
      }
    } catch (error) {
      console.error('Error in fetchAndSetUserProfile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Auth state changes are handled by the onAuthStateChange subscription
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset request function
  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (newPassword: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Check for active session on mount and handle auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener');
    
    // Set up auth state listener FIRST to avoid missing any auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        setSession(newSession);
        
        if (newSession?.user) {
          // Use setTimeout to prevent potential deadlocks with Supabase client
          setTimeout(() => {
            fetchAndSetUserProfile(newSession.user);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );
    
    // THEN check for existing session
    const initAuth = async () => {
      try {
        console.log('Checking for existing session');
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log('Found existing session:', existingSession.user.id);
          setSession(existingSession);
          await fetchAndSetUserProfile(existingSession.user);
        } else {
          console.log('No existing session found');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
      }
    };
    
    initAuth();
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    isAuthenticated: !!user,
    isLoading
  };
}
