
import React, { createContext, useContext, useState, useEffect } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { authService } from "../services/authService";

// User roles
export type UserRole = "administrator" | "skadeleder" | "servicemedarbejder";

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  // Check for active session on mount and handle auth state changes
  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSession(session);
        await fetchAndSetUserProfile(session.user);
      }
      
      setIsLoading(false);
      
      // Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setSession(session);
          
          if (session) {
            await fetchAndSetUserProfile(session.user);
          } else {
            setUser(null);
          }
          
          setIsLoading(false);
        }
      );
      
      // Cleanup subscription
      return () => {
        subscription.unsubscribe();
      };
    };
    
    initAuth();
  }, []);
  
  // Helper to fetch user profile
  const fetchAndSetUserProfile = async (authUser: SupabaseUser) => {
    try {
      // Get user profile from users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (profile) {
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          phone: profile.phone,
          jobTitle: profile.job_title
        });
      }
    } catch (error) {
      console.error('Error in fetchAndSetUserProfile:', error);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        requestPasswordReset,
        resetPassword,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Hook to check permissions based on role
export const usePermissions = () => {
  const { user } = useAuth();
  
  return {
    // General permissions
    canCreate: user?.role === "administrator" || user?.role === "skadeleder",
    canEdit: user?.role === "administrator" || user?.role === "skadeleder",
    canDelete: user?.role === "administrator",
    canViewFuelCardCode: user?.role === "administrator",
    isAdmin: user?.role === "administrator",
    isSkadeleder: user?.role === "skadeleder",
    isServicemedarbejder: user?.role === "servicemedarbejder",
    
    // Vacation specific permissions
    canApproveVacation: user?.role === "administrator",
    canViewAllVacations: user?.role === "administrator" || user?.role === "skadeleder",
    
    // Task visibility
    canSeeUnpublishedTasks: user?.role === "administrator" || user?.role === "skadeleder",
    canPublishTasks: user?.role === "administrator" || user?.role === "skadeleder",
    
    // Helper function to check if user has a specific role or higher
    hasRole: (minimumRole: UserRole): boolean => {
      if (!user) return false;
      
      if (minimumRole === "servicemedarbejder") return true; // Everyone is at least servicemedarbejder
      if (minimumRole === "skadeleder") return user.role === "skadeleder" || user.role === "administrator";
      if (minimumRole === "administrator") return user.role === "administrator";
      
      return false;
    }
  };
};
