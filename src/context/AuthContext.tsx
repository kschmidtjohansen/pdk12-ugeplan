import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AuthError, Session } from '@supabase/supabase-js';

export type UserRole = 'administrator' | 'skadeleder' | 'servicemedarbejder';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  adminResetPassword: (userId: string, newPassword: string) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });
  const { toast } = useToast();

  // Initialize auth state and set up session listener
  useEffect(() => {
    // Get the current session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          await refreshUserData(session);
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }

        // Listen for auth changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session) {
              await refreshUserData(session);
            } else {
              setAuthState({
                user: null,
                session: null,
                loading: false,
              });
            }
          }
        );

        // Cleanup subscription
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();
  }, []);

  // Helper function to fetch user data from profile and roles
  const refreshUserData = async (session: Session) => {
    try {
      const userId = session.user.id;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" error
        throw roleError;
      }

      const role = roleData?.role as UserRole || 'servicemedarbejder';

      // Update auth state with user data
      setAuthState({
        user: {
          id: userId,
          name: profile.name,
          email: profile.email,
          role,
        },
        session,
        loading: false,
      });
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // User data will be refreshed by the auth listener
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (email: string, password: string, name: string) => {
    try {
      // Register user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      // User profile will be created automatically via database trigger
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Reset password (email flow)
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  // Update password (for logged-in user)
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  };

  // Admin reset password (using edge function)
  const adminResetPassword = async (userId: string, newPassword: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          userId,
          newPassword,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    } catch (error) {
      console.error('Admin reset password error:', error);
      throw error;
    }
  };

  // Update user role (admin only)
  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-role', {
        body: {
          userId,
          role,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    } catch (error) {
      console.error('Update user role error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        register,
        resetPassword,
        updatePassword,
        adminResetPassword,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Permission helper hook
export const usePermissions = () => {
  const { user } = useAuth();

  return {
    isAdmin: user?.role === 'administrator',
    isSkadeleder: user?.role === 'skadeleder' || user?.role === 'administrator',
    isServicemedarbejder: !!user, // All authenticated users are at least servicemedarbejder
    canViewFuelCardCode: user?.role === 'administrator' || user?.role === 'skadeleder',
    canPublishTasks: user?.role === 'administrator' || user?.role === 'skadeleder',
    canApproveVacation: user?.role === 'administrator',
  };
};
