
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

// Define user roles
export type UserRole = 'administrator' | 'skadeleder' | 'servicemedarbejder';

// Export the User type from supabase for components that need it
export type { User };

// Define app user type that includes role
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSkadeleder: boolean;
  isServicemedarbejder: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  adminResetPassword: (userId: string, newPassword: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string, name: string) => Promise<{ error: string | null, user: User | null }>;
  updateUserRole: (userId: string, role: UserRole) => Promise<{ error: string | null }>;
  loading: boolean;
  canViewFuelCardCode: boolean;
  canPublishTasks: boolean;
  canApproveVacation: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canSeeUnpublishedTasks: boolean;
  validateAdminAccess: () => boolean;
  validateSkadelederAccess: () => boolean;
  hasRequiredRole: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isSkadeleder: false,
  isServicemedarbejder: false,
  login: async () => ({ error: null }),
  logout: async () => {},
  signUp: async () => ({ error: null }),
  requestPasswordReset: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  adminResetPassword: async () => ({ error: null }),
  register: async () => ({ error: null, user: null }),
  updateUserRole: async () => ({ error: null }),
  loading: true,
  canViewFuelCardCode: false,
  canPublishTasks: false,
  canApproveVacation: false,
  canEdit: false,
  canCreate: false,
  canSeeUnpublishedTasks: false,
  validateAdminAccess: () => false,
  validateSkadelederAccess: () => false,
  hasRequiredRole: () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Simplified auth initialization - no blocking async operations
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthProvider] Initializing auth...');
        
        // Get current session without blocking
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          console.log('[AuthProvider] Found existing session');
          setSession(session);
          // Create basic user object immediately - fetch additional data later
          const basicUser: AppUser = {
            id: session.user.id,
            name: session.user.email || 'User',
            email: session.user.email || '',
            role: 'servicemedarbejder' // Default role
          };
          setUser(basicUser);
        }
      } catch (error) {
        console.error('[AuthProvider] Session check failed:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('[AuthProvider] Auth initialization complete');
        }
      }
    };

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[AuthProvider] Auth event:', event);
        
        setSession(session);
        
        if (session?.user) {
          // Create basic user immediately
          const basicUser: AppUser = {
            id: session.user.id,
            name: session.user.email || 'User',
            email: session.user.email || '',
            role: 'servicemedarbejder'
          };
          setUser(basicUser);
          
          // Fetch additional user data in background without blocking
          setTimeout(() => {
            if (mounted) {
              fetchUserDataBackground(session.user);
            }
          }, 100);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Background function to fetch user profile and role data
  const fetchUserDataBackground = async (authUser: User) => {
    try {
      console.log('[AuthProvider] Fetching user data in background for:', authUser.email);
      
      const [profileResult, roleResult] = await Promise.allSettled([
        supabase.from('profiles').select('name').eq('id', authUser.id).single(),
        supabase.from('user_roles').select('role').eq('user_id', authUser.id).single()
      ]);

      const name = profileResult.status === 'fulfilled' && profileResult.value.data?.name
        ? profileResult.value.data.name
        : authUser.email || 'User';

      const role = roleResult.status === 'fulfilled' && roleResult.value.data?.role
        ? roleResult.value.data.role as UserRole
        : 'servicemedarbejder';

      const enhancedUser: AppUser = {
        id: authUser.id,
        name,
        email: authUser.email || '',
        role
      };

      setUser(enhancedUser);
      console.log('[AuthProvider] Enhanced user data loaded:', name, role);
    } catch (error) {
      console.error('[AuthProvider] Background user data fetch failed:', error);
      // Don't fail - user already has basic data
    }
  };

  // Permissions based on current user
  const isAdmin = user?.role === 'administrator';
  const isSkadeleder = user?.role === 'skadeleder';
  const isServicemedarbejder = user?.role === 'servicemedarbejder';
  const isAuthenticated = !!user;

  const canViewFuelCardCode = isAdmin;
  const canPublishTasks = isAdmin || isSkadeleder;
  const canApproveVacation = isAdmin;
  const canEdit = isAdmin || isSkadeleder;
  const canCreate = isAdmin || isSkadeleder;
  const canSeeUnpublishedTasks = isAdmin || isSkadeleder;

  // Validation methods
  const validateAdminAccess = (): boolean => {
    if (!user || user.role !== 'administrator') {
      toast({
        title: "Access Denied",
        description: "You need administrator privileges for this action.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateSkadelederAccess = (): boolean => {
    if (!user || (user.role !== 'administrator' && user.role !== 'skadeleder')) {
      toast({
        title: "Access Denied",
        description: "You need skadeleder or administrator privileges for this action.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const hasRequiredRole = (requiredRoles: UserRole[]): boolean => {
    if (!user || !requiredRoles.includes(user.role)) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to perform this action.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Simplified auth methods
  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthProvider] Attempting login for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) {
        console.error('[AuthProvider] Login error:', error);
        return { error: error.message };
      }
      
      console.log('[AuthProvider] Login successful');
      return { error: null };
    } catch (error: any) {
      console.error('[AuthProvider] Login exception:', error);
      return { error: 'An unexpected error occurred during login.' };
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthProvider] Logging out...');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('[AuthProvider] Logout error:', error);
      setUser(null);
      setSession(null);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      
      return { error: error ? error.message : null };
    } catch (error) {
      return { error: 'An unexpected error occurred during signup.' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset`,
      });
      return { error: error ? error.message : null };
    } catch (error: any) {
      return { error: 'An unexpected error occurred during password reset.' };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { 
          email, 
          password,
          userData: { name }
        }
      });
      
      if (error || !data?.user) throw error || new Error('Failed to create user');
      
      return { error: null, user: data.user };
    } catch (error) {
      return { error: 'An unexpected error occurred during registration.', user: null };
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      if (!validateAdminAccess()) {
        return { error: 'Unauthorized - requires administrator role' };
      }
      
      const { error: fnError } = await supabase.functions.invoke('admin-user-role', {
        body: { userId, role },
      });
      
      if (fnError) {
        throw new Error(fnError.message || 'Failed to update user role');
      }
      
      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred during role update.'
      };
    }
  };

  const adminResetPassword = async (userId: string, newPassword: string) => {
    try {
      if (!validateAdminAccess()) {
        return { error: 'Unauthorized - requires administrator role' };
      }
      
      const { error: fnError } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId, newPassword },
      });
      
      if (fnError) {
        throw new Error(fnError.message || 'Failed to reset password');
      }
      
      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred during password reset.'
      };
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin,
    isSkadeleder,
    isServicemedarbejder,
    login,
    logout,
    signUp,
    requestPasswordReset: resetPassword,
    resetPassword,
    adminResetPassword,
    register,
    updateUserRole,
    loading,
    canViewFuelCardCode,
    canPublishTasks,
    canApproveVacation,
    canEdit,
    canCreate,
    canSeeUnpublishedTasks,
    validateAdminAccess,
    validateSkadelederAccess,
    hasRequiredRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export const usePermissions = () => {
  const {
    isAdmin,
    isSkadeleder,
    isServicemedarbejder,
    canViewFuelCardCode,
    canPublishTasks,
    canApproveVacation,
    canEdit,
    canCreate,
    canSeeUnpublishedTasks,
    validateAdminAccess,
    validateSkadelederAccess,
    hasRequiredRole
  } = useContext(AuthContext);
  
  return {
    isAdmin,
    isSkadeleder,
    isServicemedarbejder,
    canViewFuelCardCode,
    canPublishTasks,
    canApproveVacation,
    canEdit,
    canCreate,
    canSeeUnpublishedTasks,
    validateAdminAccess,
    validateSkadelederAccess,
    hasRequiredRole
  };
};
