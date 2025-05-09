
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  resetPassword: (userId: string, newPassword: string) => Promise<void>;
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
  const { toast } = useToast();

  // Check for stored auth on mount
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setIsLoading(false);
        return;
      }
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    };
    
    checkUser();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        if (event === "SIGNED_IN" && session?.user) {
          setIsLoading(true);
          await fetchUserData(session.user.id);
          setIsLoading(false);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Fetch user data including roles from database
  const fetchUserData = async (userId: string) => {
    console.log("Fetching user data for:", userId);
    
    try {
      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }
      
      console.log("Profile data:", profileData);
      
      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .rpc('get_user_roles', { p_user_id: userId });
      
      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        return;
      }
      
      console.log("Roles data:", rolesData);
      
      // Determine primary role (administrator > skadeleder > servicemedarbejder)
      let primaryRole: UserRole = "servicemedarbejder";
      
      if (rolesData && rolesData.length > 0) {
        if (rolesData.includes("administrator")) {
          primaryRole = "administrator";
        } else if (rolesData.includes("skadeleder")) {
          primaryRole = "skadeleder";
        }
      } else {
        console.warn("No roles found for user, defaulting to servicemedarbejder");
      }
      
      console.log("Primary role determined:", primaryRole);
      
      // Set user with combined data
      setUser({
        id: userId,
        name: profileData?.name || "Unknown User",
        email: profileData?.email || userId,
        role: primaryRole,
        phone: profileData?.phone || undefined,
        jobTitle: profileData?.job_title || undefined,
      });
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    }
  };

  // Login function using Supabase auth
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log("Attempting login for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      console.log("Login successful, user ID:", data?.user?.id);
      
      // User data will be fetched through onAuthStateChange listener
    } catch (error: any) {
      console.error("Login error:", error);
      setIsLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Password reset request function
  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link",
      });
      
      setIsLoading(false);
    } catch (error: any) {
      console.error("Password reset error:", error);
      setIsLoading(false);
      throw error;
    }
  };

  // Admin reset password function
  const resetPassword = async (userId: string, newPassword: string) => {
    setIsLoading(true);
    
    try {
      // In Supabase, only the user can reset their own password
      // For admin password reset, we'd need a custom solution with edge functions
      // This is a placeholder that won't work directly with Supabase
      console.error("Direct password reset by admin is not supported with Supabase");
      setIsLoading(false);
      throw new Error("Direct password reset by admin is not supported with Supabase");
    } catch (error: any) {
      setIsLoading(false);
      throw error;
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
