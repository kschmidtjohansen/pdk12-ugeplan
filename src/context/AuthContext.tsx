
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
  refreshUserData: () => Promise<void>;
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
  refreshUserData: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Fetch user profile and role data with retry logic
  const fetchUserDataWithRetry = async (authUser: User, retryCount = 0): Promise<AppUser | null> => {
    const maxRetries = 3;
    
    try {
      console.log(`[AuthProvider] Fetching user data (attempt ${retryCount + 1})...`);
      
      const [profileResult, roleResult] = await Promise.allSettled([
        supabase.from('profiles').select('name').eq('id', authUser.id).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', authUser.id).maybeSingle()
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

      console.log(`[AuthProvider] User data loaded successfully:`, { name, role, email: authUser.email });
      return enhancedUser;
      
    } catch (error) {
      console.error(`[AuthProvider] Attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < maxRetries) {
        console.log(`[AuthProvider] Retrying in ${(retryCount + 1) * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return fetchUserDataWithRetry(authUser, retryCount + 1);
      }
      
      console.error(`[AuthProvider] All ${maxRetries} attempts failed, using fallback`);
      return {
        id: authUser.id,
        name: authUser.email || 'User',
        email: authUser.email || '',
        role: 'servicemedarbejder'
      };
    }
  };

  // Refresh user data function
  const refreshUserData = async (): Promise<void> => {
    if (!session?.user) return;
    
    console.log('[AuthProvider] Refreshing user data...');
    try {
      const refreshedUser = await fetchUserDataWithRetry(session.user);
      if (refreshedUser) {
        setUser(refreshedUser);
        console.log('[AuthProvider] User data refreshed successfully');
      }
    } catch (error) {
      console.error('[AuthProvider] Failed to refresh user data:', error);
    }
  };

  // Enhanced auth initialization
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthProvider] Initializing auth...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          console.log('[AuthProvider] Found existing session');
          setSession(session);
          
          // Fetch complete user data
          const userData = await fetchUserDataWithRetry(session.user);
          if (userData && mounted) {
            setUser(userData);
          }
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

    // Set up auth listener with enhanced handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[AuthProvider] Auth event:', event);
        
        setSession(session);
        
        if (session?.user) {
          // Set loading true for role fetch
          if (event === 'SIGNED_IN') {
            setLoading(true);
          }
          
          const userData = await fetchUserDataWithRetry(session.user);
          if (userData && mounted) {
            setUser(userData);
          }
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

  // Set up realtime listener for role changes
  useEffect(() => {
    if (!user?.id) return;

    console.log('[AuthProvider] Setting up realtime role listener...');
    
    const channel = supabase
      .channel('user_role_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        }, 
        async (payload) => {
          console.log('[AuthProvider] Role change detected:', payload);
          await refreshUserData();
        }
      )
      .subscribe();

    return () => {
      console.log('[AuthProvider] Cleaning up realtime listener');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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

  // Auth methods with better error handling
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
      
      // Refresh data after successful role update
      await refreshUserData();
      
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
    refreshUserData,
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
