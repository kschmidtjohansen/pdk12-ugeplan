
import { useState, useEffect } from "react";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { User, UserRole } from "../types/auth";
import { useToast } from "@/components/ui/use-toast";

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper to fetch user profile
  const fetchAndSetUserProfile = async (authUser: SupabaseUser) => {
    try {
      setIsLoading(true);
      console.log('Fetching user profile for:', authUser.id);
      
      // Get user profile from users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        setAuthError(`Failed to fetch user profile: ${error.message}`);
        setUser(null);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: `Failed to fetch user profile: ${error.message}`,
        });
        return;
      }
      
      if (profile) {
        console.log('User profile fetched successfully:', profile);
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as UserRole,
          phone: profile.phone,
          jobTitle: profile.job_title
        });
        setAuthError(null);
      } else {
        console.error('No user profile found:', authUser.id);
        setAuthError('User profile not found. Please contact support.');
        setUser(null);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "User profile not found. Please contact support.",
        });
      }
    } catch (error) {
      console.error('Error in fetchAndSetUserProfile:', error);
      setAuthError('An unexpected error occurred while fetching your profile.');
      setUser(null);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "An unexpected error occurred while fetching your profile.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Login error:', error);
        setAuthError(error.message);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
        throw error;
      }
      
      console.log('Login successful, session created:', data.session?.user?.id);
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
      console.log('Logging out user');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setAuthError(null);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      setAuthError('Failed to log out. Please try again.');
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Failed to log out. Please try again.",
      });
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
        toast({
          variant: "destructive",
          title: "Password Reset Failed",
          description: error.message,
        });
        throw error;
      }
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for the password reset link.",
      });
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
        toast({
          variant: "destructive",
          title: "Password Update Failed",
          description: error.message,
        });
        throw error;
      }
      
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
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
          console.log('User authenticated:', newSession.user.email);
          // Use setTimeout to prevent potential deadlocks with Supabase client
          setTimeout(() => {
            fetchAndSetUserProfile(newSession.user);
          }, 0);
        } else {
          console.log('No user session found');
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
        setAuthError('Failed to initialize authentication.');
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Failed to initialize authentication.",
        });
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
    isLoading,
    authError
  };
}
