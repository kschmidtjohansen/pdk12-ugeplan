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
  // Initialize demo role from sessionStorage with database role preference
  useEffect(() => {
    if (isDemoMode && user) {
      console.log(`[AuthContext] Initializing demo mode for user: ${user.email}`);
      console.log(`[AuthContext] User's database role: ${user.role}`);
      
      // For demo user, prioritize their actual database role
      const currentRole = user.role;
      setDemoRole(currentRole);
      sessionStorage.setItem('demo-role', currentRole);
      
      console.log(`[AuthContext] Demo role set to: ${currentRole}`);
    } else if (!isDemoMode) {
      setDemoRole(null);
      sessionStorage.removeItem('demo-role');
    }
  }, [isDemoMode, user?.role]);
  
  // Handle demo role changes
  const handleSetDemoRole = (role: UserRole) => {
    if (isDemoMode) {
      setDemoRole(role);
      sessionStorage.setItem('demo-role', role);
      console.log(`[Demo] Role switched to: ${role}`);
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
      
      // Handle role data - for demo user, ALWAYS use database role if available
      let role: UserRole = 'servicemedarbejder';
      if (roleResult.data?.role) {
        role = roleResult.data.role as UserRole;
        console.log(`[AuthContext] Using database role: ${role}`);
      } else if (isDemoUser) {
        // For demo user, if no role in database, default to administrator
        role = 'administrator';
        console.log(`[AuthContext] Demo user detected, defaulting to administrator role`);
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
      
      // For demo user, provide administrator fallback
      const isDemoUser = authUser.email === DemoUserService.DEMO_USER_EMAIL;
      const fallbackUser: AppUser = {
        id: authUser.id,
        name: isDemoUser ? 'Demo User' : (authUser.email || 'User'),
        email: authUser.email || '',
        role: isDemoUser ? 'administrator' : 'servicemedarbejder'
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

  // ENHANCED: Improved auth initialization with session cleanup and error recovery
  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] ENHANCED - Starting auth initialization...');
        
        // Set initialization timeout (8 seconds - reduced for better UX)
        initTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('[AuthContext] ENHANCED - Auth initialization timeout, forcing completion');
            setLoading(false);
          }
        }, 8000);

        // ENHANCED: Check for stale sessions and clean them up
        try {
          // First, try to refresh the session to validate it
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.log('[AuthContext] ENHANCED - Session refresh failed, clearing stale session:', refreshError.message);
            // Clear potentially stale session
            await supabase.auth.signOut();
            if (mounted) {
              setSession(null);
              setUser(null);
            }
          } else if (refreshedSession?.user && mounted) {
            console.log('[AuthContext] ENHANCED - Session refreshed successfully for:', refreshedSession.user.email);
            setSession(refreshedSession);
            
            // Fetch user data with enhanced error handling
            try {
              const userData = await fetchUserData(refreshedSession.user);
              if (userData && mounted) {
                setUser(userData);
                console.log('[AuthContext] ENHANCED - User data set successfully');
              }
            } catch (userDataError) {
              console.error('[AuthContext] ENHANCED - User data fetch failed, using fallback');
              // Create fallback user data to prevent auth loops
              const fallbackUser: AppUser = {
                id: refreshedSession.user.id,
                name: refreshedSession.user.email || 'User',
                email: refreshedSession.user.email || '',
                role: 'servicemedarbejder'
              };
              if (mounted) {
                setUser(fallbackUser);
              }
            }
          }
        } catch (sessionError) {
          console.log('[AuthContext] ENHANCED - Session validation failed, starting fresh:', sessionError);
          // Get current session as fallback
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (currentSession?.user && mounted) {
            console.log('[AuthContext] ENHANCED - Using current session for:', currentSession.user.email);
            setSession(currentSession);
            
            try {
              const userData = await fetchUserData(currentSession.user);
              if (userData && mounted) {
                setUser(userData);
              }
            } catch (userDataError) {
              console.error('[AuthContext] ENHANCED - Fallback user data fetch failed');
            }
          } else {
            console.log('[AuthContext] ENHANCED - No valid session found');
          }
        }
        
        clearTimeout(initTimeout);
      } catch (error) {
        console.error('[AuthContext] ENHANCED - Auth initialization error:', error);
        // Force clear everything on critical error
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('[AuthContext] ENHANCED - Auth initialization complete');
        }
      }
    };

    // ENHANCED: More robust auth state change handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log('[AuthContext] ENHANCED - Auth event:', event, 'Session valid:', !!newSession?.user);
        
        // Handle different auth events specifically
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          setUser(newSession?.user ? null : null); // Will be set below if user exists
        } else {
          setSession(newSession);
        }
        
        if (newSession?.user) {
          console.log('[AuthContext] ENHANCED - Processing auth event with user:', newSession.user.email);
          
          // Use requestIdleCallback if available, otherwise setTimeout
          const deferredFetch = () => {
            if (!mounted) return;
            
            fetchUserData(newSession.user)
              .then(userData => {
                if (userData && mounted) {
                  setUser(userData);
                  console.log('[AuthContext] ENHANCED - User data updated from auth event');
                }
              })
              .catch(error => {
                console.error('[AuthContext] ENHANCED - User data fetch failed in auth event:', error);
                // Set fallback user data to prevent auth loops
                if (mounted) {
                  const fallbackUser: AppUser = {
                    id: newSession.user.id,
                    name: newSession.user.email || 'User',
                    email: newSession.user.email || '',
                    role: 'servicemedarbejder'
                  };
                  setUser(fallbackUser);
                }
              });
          };

          if ('requestIdleCallback' in window) {
            requestIdleCallback(deferredFetch);
          } else {
            setTimeout(deferredFetch, 0);
          }
        } else {
          console.log('[AuthContext] ENHANCED - No user in auth event, clearing user state');
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
