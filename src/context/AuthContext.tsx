
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { UserRole, TableProfile } from "@/types/supabase";

// User interface
export interface UserWithProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
  onLeave?: boolean;
  notes?: string;
}

// Auth context interface
interface AuthContextType {
  user: UserWithProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert Supabase user and profile to our UserWithProfile format
  const buildUserWithProfile = async (user: User): Promise<UserWithProfile | null> => {
    if (!user) return null;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error || !profile) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return {
        id: user.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone,
        jobTitle: profile.job_title,
        onLeave: profile.on_leave,
        notes: profile.notes,
      };
    } catch (error) {
      console.error('Error building user profile:', error);
      return null;
    }
  };

  // Setup auth state listener and get initial session
  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer profile fetching to avoid recursion
          setTimeout(async () => {
            const userWithProfile = await buildUserWithProfile(currentSession.user);
            setUser(userWithProfile);
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Then get the initial session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          const userWithProfile = await buildUserWithProfile(currentSession.user);
          setUser(userWithProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
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
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  // Password reset request function
  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error requesting password reset:', error);
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
        password: newPassword
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login,
        signup,
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
