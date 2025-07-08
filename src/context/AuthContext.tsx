import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { DemoUserService } from '@/services/demoUserService';

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
  // Demo mode properties
  isDemoMode: boolean;
  demoRole: UserRole | null;
  setDemoRole: (role: UserRole) => void;
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
  // Demo mode properties
  isDemoMode: false,
  demoRole: null,
  setDemoRole: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);
  const { toast } = useToast();
  
  // Demo mode detection
  const demoService = DemoUserService.getInstance();
  const isDemoMode = user ? demoService.isDemoUser(user.email) : false;
  
  // Initialize demo role from sessionStorage
  useEffect(() => {
    if (isDemoMode) {
      const savedDemoRole = sessionStorage.getItem('demo-role') as UserRole | null;
      if (savedDemoRole && ['administrator', 'skadeleder', 'servicemedarbejder'].includes(savedDemoRole)) {
        setDemoRole(savedDemoRole);
      } else {
        setDemoRole('administrator'); // Default to admin for demo
        sessionStorage.setItem('demo-role', 'administrator');
      }
    } else {
      setDemoRole(null);
      sessionStorage.removeItem('demo-role');
    }
  }, [isDemoMode]);
  
  // Handle demo role changes
  const handleSetDemoRole = (role: UserRole) => {
    if (isDemoMode) {
      setDemoRole(role);
      sessionStorage.setItem('demo-role', role);
      console.log(`[Demo] Role switched to: ${role}`);
    }
  };

  // Simplified user data fetching
  const fetchUserData = async (authUser: User): Promise<AppUser | null> => {
    console.log(`[AuthContext] Fetching user data for: ${authUser.email}`);
    
    try {
      const [profileResult, roleResult] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', authUser.id).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', authUser.id).maybeSingle()
      ]);

      console.log(`[AuthContext] Profile result:`, profileResult);
      console.log(`[AuthContext] Role result:`, roleResult);

      if (profileResult.error) {
        console.error('[AuthContext] Profile fetch error:', profileResult.error);
      }

      if (roleResult.error) {
        console.error('[AuthContext] Role fetch error:', roleResult.error);
      }

      const name = profileResult.data?.name || authUser.email || 'User';
      const role = (roleResult.data?.role as UserRole) || 'servicemedarbejder';

      const enhancedUser: AppUser = {
        id: authUser.id,
        name,
        email: authUser.email || '',
        role
      };

      console.log(`[AuthContext] User data created:`, enhancedUser);
      return enhancedUser;
      
    } catch (error) {
      console.error(`[AuthContext] User data fetch failed:`, error);
      
      // Return fallback user data
      const fallbackUser: AppUser = {
        id: authUser.id,
        name: authUser.email || 'User',
        email: authUser.email || '',
        role: 'servicemedarbejder'
      };
      
      console.log(`[AuthContext] Using fallback user data:`, fallbackUser);
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

  // Simplified auth initialization
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Starting auth initialization...');
        
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user && mounted) {
          console.log('[AuthContext] Found existing session for:', currentSession.user.email);
          setSession(currentSession);
          
          const userData = await fetchUserData(currentSession.user);
          if (userData && mounted) {
            setUser(userData);
          }
        } else {
          console.log('[AuthContext] No existing session found');
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('[AuthContext] Auth initialization complete');
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log('[AuthContext] Auth event:', event, 'Session valid:', !!newSession?.user);
        
        setSession(newSession);
        
        if (newSession?.user) {
          console.log('[AuthContext] Processing auth event with user:', newSession.user.email);
          
          const userData = await fetchUserData(newSession.user);
          if (userData && mounted) {
            setUser(userData);
            console.log('[AuthContext] User data updated from auth event');
          }
        } else {
          console.log('[AuthContext] No user in auth event, clearing user state');
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

  // Simplified login method
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
      console.log('[AuthProvider] FIXED - Logging out...');
      
      // Clean up demo data if in demo mode
      if (isDemoMode) {
        console.log('[Demo] Cleaning up demo data on logout...');
        await demoService.cleanupDemoData();
      }
      
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
    // Demo mode properties
    isDemoMode,
    demoRole,
    setDemoRole: handleSetDemoRole,
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
