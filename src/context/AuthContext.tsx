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

  // FIXED: Enhanced user data fetching with proper error handling and timeouts
  const fetchUserData = async (authUser: User): Promise<AppUser | null> => {
    const startTime = Date.now();
    console.log(`[AuthContext] FIXED - Starting user data fetch for: ${authUser.email}`);
    
    try {
      // Create timeout promise (5 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('User data fetch timeout after 5 seconds')), 5000);
      });

      // Create the actual fetch promise
      const fetchPromise = Promise.all([
        supabase.from('profiles').select('name').eq('id', authUser.id).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', authUser.id).maybeSingle()
      ]);

      // Race between fetch and timeout
      const [profileResult, roleResult] = await Promise.race([fetchPromise, timeoutPromise]);

      console.log(`[AuthContext] FIXED - Database queries completed in ${Date.now() - startTime}ms`);
      console.log(`[AuthContext] FIXED - Profile result:`, profileResult);
      console.log(`[AuthContext] FIXED - Role result:`, roleResult);

      // Handle profile data
      const name = profileResult.data?.name || authUser.email || 'User';
      
      // Handle role data with fallback
      const role = (roleResult.data?.role as UserRole) || 'servicemedarbejder';

      const enhancedUser: AppUser = {
        id: authUser.id,
        name,
        email: authUser.email || '',
        role
      };

      console.log(`[AuthContext] FIXED - User data created successfully:`, {
        name,
        role,
        email: authUser.email,
        totalTime: Date.now() - startTime
      });
      
      return enhancedUser;
      
    } catch (error) {
      console.error(`[AuthContext] FIXED - User data fetch failed after ${Date.now() - startTime}ms:`, error);
      
      // CRITICAL: Always return fallback user data to prevent login loops
      const fallbackUser: AppUser = {
        id: authUser.id,
        name: authUser.email || 'User',
        email: authUser.email || '',
        role: 'servicemedarbejder'
      };
      
      console.log(`[AuthContext] FIXED - Using fallback user data:`, fallbackUser);
      return fallbackUser;
    }
  };

  // Refresh user data function
  const refreshUserData = async (): Promise<void> => {
    if (!session?.user) {
      console.log('[AuthContext] FIXED - No session user for refresh');
      return;
    }
    
    console.log('[AuthContext] FIXED - Refreshing user data...');
    try {
      const refreshedUser = await fetchUserData(session.user);
      if (refreshedUser) {
        setUser(refreshedUser);
        console.log('[AuthContext] FIXED - User data refreshed successfully');
      }
    } catch (error) {
      console.error('[AuthContext] FIXED - Failed to refresh user data:', error);
    }
  };

  // FIXED: Improved auth initialization with better error handling
  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] FIXED - Starting auth initialization...');
        
        // Set initialization timeout (10 seconds)
        initTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('[AuthContext] FIXED - Auth initialization timeout, forcing completion');
            setLoading(false);
          }
        }, 10000);

        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthContext] FIXED - Session check error:', sessionError);
          throw sessionError;
        }
        
        if (currentSession?.user && mounted) {
          console.log('[AuthContext] FIXED - Found existing session for:', currentSession.user.email);
          setSession(currentSession);
          
          // Fetch user data with timeout protection
          try {
            const userData = await fetchUserData(currentSession.user);
            if (userData && mounted) {
              setUser(userData);
              console.log('[AuthContext] FIXED - User data set successfully');
            }
          } catch (userDataError) {
            console.error('[AuthContext] FIXED - User data fetch failed, but continuing with session');
          }
        } else {
          console.log('[AuthContext] FIXED - No existing session found');
        }
        
        clearTimeout(initTimeout);
      } catch (error) {
        console.error('[AuthContext] FIXED - Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('[AuthContext] FIXED - Auth initialization complete');
        }
      }
    };

    // FIXED: Improved auth state change handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log('[AuthContext] FIXED - Auth event:', event);
        
        // Always update session first
        setSession(newSession);
        
        if (newSession?.user) {
          console.log('[AuthContext] FIXED - Processing auth event with user:', newSession.user.email);
          
          // Defer user data fetching to avoid blocking the auth flow
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const userData = await fetchUserData(newSession.user);
              if (userData && mounted) {
                setUser(userData);
                console.log('[AuthContext] FIXED - User data updated from auth event');
              }
            } catch (error) {
              console.error('[AuthContext] FIXED - User data fetch failed in auth event:', error);
            }
          }, 0);
        } else {
          console.log('[AuthContext] FIXED - No user in auth event, clearing user state');
          setUser(null);
        }
        
        // Always ensure loading is false after auth events
        setLoading(false);
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

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

  // FIXED: Enhanced login method with better error handling
  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthProvider] FIXED - Attempting login for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) {
        console.error('[AuthProvider] FIXED - Login error:', error);
        return { error: error.message };
      }
      
      console.log('[AuthProvider] FIXED - Login successful, auth state change will handle user data');
      return { error: null };
    } catch (error: any) {
      console.error('[AuthProvider] FIXED - Login exception:', error);
      return { error: 'An unexpected error occurred during login.' };
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthProvider] FIXED - Logging out...');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('[AuthProvider] FIXED - Logout error:', error);
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
