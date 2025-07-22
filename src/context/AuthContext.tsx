import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { DemoUserService } from '@/services/demoUserService';
import { circuitBreaker } from '@/services/circuitBreakerService';
import { useTranslation } from './TranslationContext';

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
  authReady: boolean;
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
  authReady: false,
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
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Demo mode detection with enhanced logging
  const demoService = DemoUserService.getInstance();
  const isDemoMode = user ? demoService.isDemoUser(user.email) : false;

  // Circuit breaker for auth operations
  const AUTH_OPERATION_ID = 'auth_initialization';

  // Enhanced user data fetching with demo user support
  const fetchUserData = async (authUser: User): Promise<AppUser | null> => {
    const startTime = Date.now();
    console.log(`[AuthContext] SESSION EXPIRATION FIX - Starting user data fetch for: ${authUser.email}`);
    
    if (!circuitBreaker.canProceed(`user_data_fetch_${authUser.id}`)) {
      console.warn(`[AuthContext] Circuit breaker open for user data fetch: ${authUser.email}`);
      return null;
    }
    
    try {
      // Create the actual fetch promise with timeout
      const fetchPromise = Promise.all([
        supabase.from('profiles').select('name').eq('id', authUser.id).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', authUser.id).maybeSingle()
      ]);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User data fetch timeout')), 5000)
      );

      const [profileResult, roleResult] = await Promise.race([fetchPromise, timeoutPromise]) as any;

      console.log(`[AuthContext] Database queries completed in ${Date.now() - startTime}ms`);

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
      
      circuitBreaker.recordSuccess(`user_data_fetch_${authUser.id}`);
      return enhancedUser;
      
    } catch (error) {
      console.error(`[AuthContext] User data fetch failed after ${Date.now() - startTime}ms:`, error);
      circuitBreaker.recordFailure(`user_data_fetch_${authUser.id}`);
      
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

  // SESSION EXPIRATION FIX: Enhanced auth initialization with session expiration handling
  useEffect(() => {
    let mounted = true;
    let initializationComplete = false;

    console.log('[AuthContext] SESSION EXPIRATION FIX - Starting authentication initialization...');

    // Circuit breaker check
    if (!circuitBreaker.canProceed(AUTH_OPERATION_ID)) {
      console.warn('[AuthContext] Auth initialization circuit breaker is open');
      setLoading(false);
      setAuthReady(true);
      return;
    }

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] SESSION EXPIRATION FIX - Setting up auth state listener...');
        
        // Set up auth listener FIRST - this handles all future auth changes including session expiration
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mounted) return;

            console.log('[AuthContext] SESSION EXPIRATION FIX - Auth state change:', event, !!newSession?.user);
            
            // Handle session expiration - key fix for the redirect loop
            if (event === 'SIGNED_OUT' && session && !newSession) {
              console.log('[AuthContext] SESSION EXPIRATION FIX - Session expired, clearing state and redirecting');
              setSessionExpired(true);
              setUser(null);
              setSession(null);
              
              // Show session expired toast
              toast({
                title: t('auth.sessionExpiredTitle'),
                description: t('auth.sessionExpiredDescription'),
                variant: "destructive",
              });
              
              // Clear any sensitive data
              sessionStorage.clear();
              
              // Force redirect to login after a brief delay
              setTimeout(() => {
                window.location.href = '/login';
              }, 1000);
              
              return;
            }
            
            // Handle token refresh events
            if (event === 'TOKEN_REFRESHED' && newSession) {
              console.log('[AuthContext] SESSION EXPIRATION FIX - Token refreshed successfully');
              setSession(newSession);
              setSessionExpired(false);
              return;
            }
            
            // Update session state immediately
            setSession(newSession);
            setSessionExpired(false);
            
            if (newSession?.user) {
              // Fetch user data asynchronously but don't block auth state
              setTimeout(async () => {
                if (!mounted) return;
                
                try {
                  const userData = await fetchUserData(newSession.user);
                  if (userData && mounted) {
                    setUser(userData);
                  }
                } catch (error) {
                  console.warn('[AuthContext] User data fetch in auth change failed:', error);
                  // Use fallback user data
                  if (mounted) {
                    setUser({
                      id: newSession.user.id,
                      name: newSession.user.email || 'User',
                      email: newSession.user.email || '',
                      role: 'servicemedarbejder'
                    });
                  }
                }
              }, 0);
            } else {
              setUser(null);
            }

            // Mark auth as ready after first state change
            if (!initializationComplete) {
              setLoading(false);
              setAuthReady(true);
              initializationComplete = true;
            }
          }
        );

        // Check for existing session with timeout
        console.log('[AuthContext] SESSION EXPIRATION FIX - Checking for existing session...');
        
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        );

        try {
          const { data: { session: currentSession }, error } = await Promise.race([
            sessionPromise, 
            timeoutPromise
          ]) as any;

          if (!mounted) return;

          if (error) {
            console.error('[AuthContext] SESSION EXPIRATION FIX - Session check error:', error);
            throw error;
          }

          console.log('[AuthContext] SESSION EXPIRATION FIX - Session check result:', !!currentSession?.user);
          
          // If we have a session, the auth state change listener will handle it
          // If we don't, we're done initializing
          if (!currentSession) {
            setSession(null);
            setUser(null);
            if (!initializationComplete) {
              setLoading(false);
              setAuthReady(true);
              initializationComplete = true;
            }
          }
          
          circuitBreaker.recordSuccess(AUTH_OPERATION_ID);
          
        } catch (error) {
          console.error('[AuthContext] SESSION EXPIRATION FIX - Session check failed:', error);
          circuitBreaker.recordFailure(AUTH_OPERATION_ID);
          
          // Fail gracefully
          setSession(null);
          setUser(null);
          if (!initializationComplete) {
            setLoading(false);
            setAuthReady(true);
            initializationComplete = true;
          }
        }

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };

      } catch (error) {
        console.error('[AuthContext] SESSION EXPIRATION FIX - Auth initialization failed:', error);
        circuitBreaker.recordFailure(AUTH_OPERATION_ID);
        
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setAuthReady(true);
        }
      }
    };

    // Force completion after maximum timeout
    const forceCompleteTimeout = setTimeout(() => {
      if (mounted && !initializationComplete) {
        console.warn('[AuthContext] SESSION EXPIRATION FIX - Force completing auth initialization due to timeout');
        setLoading(false);
        setAuthReady(true);
        initializationComplete = true;
      }
    }, 5000);

    const cleanup = initializeAuth();
    
    return () => {
      mounted = false;
      clearTimeout(forceCompleteTimeout);
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => {
          if (typeof cleanupFn === 'function') {
            cleanupFn();
          }
        });
      }
    };
  }, [toast, t]);

  // Demo role management (simplified)
  useEffect(() => {
    if (isDemoMode && user) {
      const savedDemoRole = sessionStorage.getItem('demo-role') as UserRole | null;
      
      if (savedDemoRole && ['administrator', 'skadeleder', 'servicemedarbejder'].includes(savedDemoRole)) {
        setDemoRole(savedDemoRole);
      } else {
        setDemoRole('administrator');
        sessionStorage.setItem('demo-role', 'administrator');
      }
    } else if (!isDemoMode) {
      setDemoRole(null);
      sessionStorage.removeItem('demo-role');
    }
  }, [isDemoMode, user?.id]);
  
  // Handle demo role changes
  const handleSetDemoRole = (role: UserRole) => {
    if (isDemoMode && user) {
      console.log(`[Demo] Role switching from ${demoRole || user.role} to ${role}`);
      setDemoRole(role);
      sessionStorage.setItem('demo-role', role);
      
      toast({
        title: "Rolle Ændret",
        description: `Skiftet til ${role}`,
      });
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

  // Permissions based on current user (with demo role override)
  const currentRole = isDemoMode && demoRole ? demoRole : user?.role;
  const isAdmin = currentRole === 'administrator';
  const isSkadeleder = currentRole === 'skadeleder';
  const isServicemedarbejder = currentRole === 'servicemedarbejder';
  const isAuthenticated = !!user && !!session;

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


  // Enhanced login method with better error handling
  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthProvider] COMPREHENSIVE FIX - Attempting login for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) {
        console.error('[AuthProvider] COMPREHENSIVE FIX - Login error:', error);
        return { error: error.message };
      }
      
      toast({
        title: "Login Succesfuld",
        description: "Du er nu logget ind.",
      });
      

      console.log('[AuthProvider] COMPREHENSIVE FIX - Login successful');
      return { error: null };
    } catch (error: any) {
      console.error('[AuthProvider] COMPREHENSIVE FIX - Login exception:', error);
      return { error: 'An unexpected error occurred during login.' };
    }
  };


  // Enhanced logout method with session expiration support
  const logout = async () => {
    try {
      console.log('[AuthProvider] SESSION EXPIRATION FIX - Logging out...');
      
      // Clean up demo data if in demo mode
      if (isDemoMode) {
        console.log('[Demo] Cleaning up demo data on logout...');
        await demoService.cleanupDemoData();
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setSessionExpired(false);
      
      // Clear session storage
      sessionStorage.clear();
      
    } catch (error) {
      console.error('[AuthProvider] SESSION EXPIRATION FIX - Logout error:', error);
      setUser(null);
      setSession(null);
      setSessionExpired(false);
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
    isAuthenticated: !!user && !!session && !sessionExpired,
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
    authReady,
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
