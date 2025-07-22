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
  isEffectiveAdmin: boolean;
  isEffectiveSkadeleder: boolean;
  isEffectiveServicemedarbejder: boolean;
  effectiveRole: UserRole | null;
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
  isEffectiveAdmin: false,
  isEffectiveSkadeleder: false,
  isEffectiveServicemedarbejder: false,
  effectiveRole: null,
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
  
  // Demo mode detection with enhanced logging
  const demoService = DemoUserService.getInstance();
  const isDemoMode = user ? demoService.isDemoUser(user.email) : false;
  
  // Log demo mode status changes
  useEffect(() => {
    if (user) {
      console.log(`[AuthContext] Demo mode status for ${user.email}: ${isDemoMode}`);
      console.log(`[AuthContext] User role: ${user.role}`);
    }
  }, [isDemoMode, user]);

  // SINGLE SOURCE OF TRUTH: Demo role management (runs AFTER user data is loaded)
  useEffect(() => {
    if (isDemoMode && user) {
      console.log(`[AuthContext] Demo role initialization for: ${user.email}`);
      
      // ALWAYS prioritize saved demo role over everything else
      const savedDemoRole = sessionStorage.getItem('demo-role') as UserRole | null;
      
      if (savedDemoRole && ['administrator', 'skadeleder', 'servicemedarbejder'].includes(savedDemoRole)) {
        console.log(`[AuthContext] Using saved demo role: ${savedDemoRole}`);
        setDemoRole(savedDemoRole);
      } else {
        // Only set default if no saved role exists
        console.log(`[AuthContext] No saved demo role, defaulting to administrator`);
        setDemoRole('administrator');
        sessionStorage.setItem('demo-role', 'administrator');
      }
    } else if (!isDemoMode) {
      console.log(`[AuthContext] Clearing demo role (not in demo mode)`);
      setDemoRole(null);
      sessionStorage.removeItem('demo-role');
    }
  }, [isDemoMode, user?.id]); // Trigger when demo mode or user ID changes (after user data is loaded)
  
  // Handle demo role changes WITHOUT page reload
  const handleSetDemoRole = (role: UserRole) => {
    if (isDemoMode && user) {
      console.log(`[Demo] Role switching from ${demoRole || user.role} to ${role}`);
      setDemoRole(role);
      sessionStorage.setItem('demo-role', role);
      
      console.log(`[Demo] Role switched successfully to: ${role}`);
      
      toast({
        title: "Rolle Ændret",
        description: `Skiftet til ${role}`,
      });
    }
  };

  // Enhanced user data fetching with demo user support
  const fetchUserData = async (authUser: User): Promise<AppUser | null> => {
    const startTime = Date.now();
    console.log(`[AuthContext] Starting user data fetch for: ${authUser.email}`);
    
    try {
      // Create the actual fetch promise
      const [profileResult, roleResult] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', authUser.id).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', authUser.id).maybeSingle()
      ]);

      console.log(`[AuthContext] Database queries completed in ${Date.now() - startTime}ms`);
      console.log(`[AuthContext] Profile result:`, profileResult);
      console.log(`[AuthContext] Role result:`, roleResult);

      // Check for database errors
      if (profileResult.error) {
        console.error('[AuthContext] Profile fetch error:', profileResult.error);
      }
      if (roleResult.error) {
        console.error('[AuthContext] Role fetch error:', roleResult.error);
      }

      // Handle profile data - use "Demo User" for demo user, otherwise use profile name or email
      const isDemoUser = authUser.email === DemoUserService.DEMO_USER_EMAIL;
      const name = isDemoUser ? 'Demo User' : (profileResult.data?.name || authUser.email || 'User');
      
      // Handle role data - SIMPLIFIED: Always use database role here, demo logic handles itself
      let role: UserRole = 'servicemedarbejder';
      
      if (isDemoUser) {
        // For demo user, use database role or default to administrator
        if (roleResult.data?.role) {
          role = roleResult.data.role as UserRole;
          console.log(`[AuthContext] Demo user: Using database role: ${role}`);
        } else {
          role = 'administrator';
          console.log(`[AuthContext] Demo user: No role found, defaulting to administrator`);
        }
      } else if (roleResult.data?.role) {
        role = roleResult.data.role as UserRole;
        console.log(`[AuthContext] Regular user: Using database role: ${role}`);
      }

      const enhancedUser: AppUser = {
        id: authUser.id,
        name,
        email: authUser.email || '',
        role
      };

      console.log(`[AuthContext] User data created successfully:`, {
        name,
        role,
        email: authUser.email,
        isDemoUser,
        totalTime: Date.now() - startTime
      });
      
      return enhancedUser;
      
    } catch (error) {
      console.error(`[AuthContext] User data fetch failed after ${Date.now() - startTime}ms:`, error);
      
      // For demo user, provide fallback - keep it simple
      const isDemoUser = authUser.email === DemoUserService.DEMO_USER_EMAIL;
      const fallbackRole: UserRole = isDemoUser ? 'administrator' : 'servicemedarbejder';
      
      const fallbackUser: AppUser = {
        id: authUser.id,
        name: isDemoUser ? 'Demo User' : (authUser.email || 'User'),
        email: authUser.email || '',
        role: fallbackRole
      };
      
      console.log(`[AuthContext] Using fallback user data:`, fallbackUser);
      return fallbackUser;
    }
  };

  // Refresh user data function
  const refreshUserData = async (): Promise<void> => {
    if (!session?.user) {
      console.log('[AuthContext] No session user for refresh');
      return;
    }
    
    console.log('[AuthContext] Refreshing user data...');
    try {
      const refreshedUser = await fetchUserData(session.user);
      if (refreshedUser) {
        setUser(refreshedUser);
        console.log('[AuthContext] User data refreshed successfully');
      }
    } catch (error) {
      console.error('[AuthContext] Failed to refresh user data:', error);
    }
  };

  // CRITICAL FIX: Ultra-simplified auth initialization
  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    console.log('[AuthContext] CRITICAL FIX - Starting auth initialization...');

    // Very aggressive timeout to prevent infinite loading
    initTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[AuthContext] CRITICAL FIX - Force completing auth initialization');
        setLoading(false);
      }
    }, 2000); // Very short timeout

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;

        console.log('[AuthContext] CRITICAL FIX - Auth event:', event, !!newSession?.user);
        
        clearTimeout(initTimeout);
        setSession(newSession);
        setLoading(false);
        
        if (newSession?.user) {
          // Fire and forget user data fetch - don't block authentication
          fetchUserData(newSession.user)
            .then(userData => {
              if (userData && mounted) {
                setUser(userData);
              }
            })
            .catch(error => {
              console.warn('[AuthContext] User data fetch failed, using fallback:', error);
              if (mounted) {
                setUser({
                  id: newSession.user.id,
                  name: newSession.user.email || 'User',
                  email: newSession.user.email || '',
                  role: 'servicemedarbejder'
                });
              }
            });
        } else {
          setUser(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('[AuthContext] CRITICAL FIX - Session error:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      if (currentSession?.user) {
        console.log('[AuthContext] CRITICAL FIX - Found session:', currentSession.user.email);
        setSession(currentSession);
        setLoading(false);
        
        // Fire and forget user data fetch
        fetchUserData(currentSession.user)
          .then(userData => {
            if (userData && mounted) {
              setUser(userData);
            }
          })
          .catch(error => {
            console.warn('[AuthContext] Initial user data fetch failed:', error);
            if (mounted) {
              setUser({
                id: currentSession.user.id,
                name: currentSession.user.email || 'User',
                email: currentSession.user.email || '',
                role: 'servicemedarbejder'
              });
            }
          });
      } else {
        console.log('[AuthContext] CRITICAL FIX - No session found');
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  // Permissions based on current user (with demo role override)
  const currentRole = isDemoMode && demoRole ? demoRole : user?.role;
  const isAdmin = currentRole === 'administrator';
  const isSkadeleder = currentRole === 'skadeleder';
  const isServicemedarbejder = currentRole === 'servicemedarbejder';
  const isAuthenticated = !!user;

  // Effective role permissions (considering demo mode)
  const isEffectiveAdmin = currentRole === 'administrator';
  const isEffectiveSkadeleder = currentRole === 'skadeleder';
  const isEffectiveServicemedarbejder = currentRole === 'servicemedarbejder';

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

  // SIMPLIFIED: Enhanced login method with better error handling
  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthProvider] SIMPLIFIED - Attempting login for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) {
        console.error('[AuthProvider] SIMPLIFIED - Login error:', error);
        return { error: error.message };
      }
      
      toast({
        title: "Login Succesfuld",
        description: "Du er nu logget ind.",
      });
      
      console.log('[AuthProvider] SIMPLIFIED - Login successful, auth state change will handle user data');
      return { error: null };
    } catch (error: any) {
      console.error('[AuthProvider] SIMPLIFIED - Login exception:', error);
      return { error: 'An unexpected error occurred during login.' };
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthProvider] SIMPLIFIED - Logging out...');
      
      // Clean up demo data if in demo mode
      if (isDemoMode) {
        console.log('[Demo] Cleaning up demo data on logout...');
        await demoService.cleanupDemoData();
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('[AuthProvider] SIMPLIFIED - Logout error:', error);
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
    isEffectiveAdmin,
    isEffectiveSkadeleder,
    isEffectiveServicemedarbejder,
    effectiveRole: currentRole,
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
    isEffectiveAdmin,
    isEffectiveSkadeleder,
    isEffectiveServicemedarbejder,
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
    isEffectiveAdmin,
    isEffectiveSkadeleder,
    isEffectiveServicemedarbejder,
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
