
import React, { createContext, useContext } from "react";
import { Session } from "@supabase/supabase-js";
import { UserWithProfile } from "@/types/auth";
import { useAuthState } from "@/hooks/useAuthState";
import { login, signup, logout, requestPasswordReset, resetPassword } from "@/services/authService";

// Export types for use in other components
export type { User, UserRole, UserWithProfile } from "@/types/auth";

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
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, isAuthenticated, isLoading } = useAuthState();

  // Login function
  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  // Signup function
  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      await signup(email, password, name);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  // Password reset request function
  const handleRequestPasswordReset = async (email: string) => {
    try {
      await requestPasswordReset(email);
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  };

  // Reset password function
  const handleResetPassword = async (newPassword: string) => {
    try {
      await resetPassword(newPassword);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        requestPasswordReset: handleRequestPasswordReset,
        resetPassword: handleResetPassword,
        isAuthenticated,
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

// Export usePermissions from the new file
export { usePermissions } from '@/hooks/usePermissions';
