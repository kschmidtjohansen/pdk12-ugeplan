
import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { User } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { fetchUserProfile, loginUser, logoutUser, requestPasswordReset as requestReset, resetPassword as resetPwd } from "./api";

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      await loginUser(email, password);
      // Auth state changes are handled by the onAuthStateChange subscription
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message);
      setIsLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await logoutUser();
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
      await requestReset(email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (newPassword: string) => {
    setIsLoading(true);
    
    try {
      await resetPwd(newPassword);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password Update Failed",
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle setting user profile from Supabase user
  const handleUserProfileUpdate = async (authUser: any) => {
    try {
      setIsLoading(true);
      const { user: profile, error } = await fetchUserProfile(authUser);
      
      if (error) {
        console.error("Error fetching user profile:", error);
        setAuthError(error);
        setUser(null);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error,
        });
      } else if (profile) {
        console.log("User profile loaded successfully:", profile);
        setUser(profile);
        setAuthError(null);
      }
    } catch (error: any) {
      console.error('Error handling user profile update:', error);
      setAuthError('Failed to process authentication.');
      setUser(null);
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
            handleUserProfileUpdate(newSession.user);
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
          await handleUserProfileUpdate(existingSession.user);
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
