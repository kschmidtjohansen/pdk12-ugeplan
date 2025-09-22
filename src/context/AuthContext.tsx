import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { DemoUserService } from '@/services/demoUserService';
import { circuitBreaker } from '@/services/circuitBreakerService';
import { TranslationContext } from './TranslationContext';

// Define user roles
export type UserRole = 'administrator' | 'skadeleder' | 'servicemedarbejder' | 'vikar';

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
  session: Session | null;
  isAuthenticated: boolean;
  userDataLoaded: boolean;
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
  session: null,
  isAuthenticated: false,
  userDataLoaded: false,
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
  const [userDataLoaded, setUserDataLoaded] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Safe translation hook with fallback
  const translationContext = useContext(TranslationContext);
  const t = (translationContext?.t || ((key: string) => key)) as (key: string, params?: Record<string, any>) => string;
  
  // Demo mode detection with enhanced logging
  const demoService = DemoUserService.getInstance();
  const isDemoMode = user ? demoService.isDemoUser(user.email) : false;

  // Circuit breaker for auth operations
  const AUTH_OPERATION_ID = 'auth_initialization';

  // Streamlined user data fetching
  const fetchUserData = async (authUser: User): Promise<AppUser | null> => {
    if (!circuitBreaker.canProceed(`user_data_fetch_${authUser.id}`)) {
      return null;
    }
    
    try {
      // Use secure function to get user profile with role with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User data fetch timeout')), 3000)
      );
      
      const fetchPromise = supabase
        .rpc('get_profile_detailed', { profile_user_id: authUser.id })
        .maybeSingle();

      const profileResult = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (profileResult.error) {
        // Fallback user with email as name
        const appUser: AppUser = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.email,
          role: 'servicemedarbejder'
        };
        return appUser;
      }

      // Handle demo user and regular users
      const isDemoUser = authUser.email === DemoUserService.DEMO_USER_EMAIL;
      const name = isDemoUser ? 'Demo User' : (profileResult.data?.name || authUser.email || 'Unknown User');
      const role: UserRole = profileResult.data?.role || (isDemoUser ? 'administrator' : 'servicemedarbejder');

      const enhancedUser: AppUser = {
        id: authUser.id,
        name,
        email: authUser.email || '',
        role
      };
      
      circuitBreaker.recordSuccess(`user_data_fetch_${authUser.id}`);
      return enhancedUser;
      
    } catch (error) {
      circuitBreaker.recordFailure(`user_data_fetch_${authUser.id}`);
      
      // Better fallback handling 
      const isDemoUser = authUser.email === DemoUserService.DEMO_USER_EMAIL;
      const fallbackRole: UserRole = isDemoUser ? 'administrator' : 'servicemedarbejder';
      const fallbackName = isDemoUser ? 'Demo User' : (authUser.email || 'Unknown User');
      
      const fallbackUser: AppUser = {
        id: authUser.id,
        name: fallbackName,
        email: authUser.email || '',
        role: fallbackRole
      };
      
      console.log(`[AuthContext] BRIAN REUS DEBUG - Using fallback user data due to error:`, fallbackUser);
      console.error(`[AuthContext] BRIAN REUS DEBUG - Error details:`, error);
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
      setAuthInitialized(true);
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
                title: t('auth.sessionExpiredTitle') || 'Session Expired',
                description: t('auth.sessionExpiredDescription') || 'Please log in again',
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
            
            // Handle successful sign in - but don't show login toast here (handled in login form)
            if (event === 'SIGNED_IN' && newSession) {
              console.log('[AuthContext] SESSION EXPIRATION FIX - User signed in successfully');
              // Don't show login success toast here - it's handled in the login form
              setSession(newSession);
              setSessionExpired(false);
              return;
            }
            
            // Update session state immediately
            setSession(newSession);
            setSessionExpired(false);
            
            if (newSession?.user) {
              // KASPER FIX: Don't set user immediately, wait for complete data
              console.log(`[AuthContext] KASPER FIX - Starting user data fetch for:`, newSession.user.email);
              setUser(null);
              setUserDataLoaded(false);
              
              // KASPER FIX: Fetch complete user data BEFORE setting user state (deferred to avoid deadlocks)
              setTimeout(() => {
                (async () => {
                  if (!mounted) return;
                  
                  try {
                    console.log(`[AuthContext] KASPER FIX - Fetching complete user data for:`, newSession.user.email);
                    const userData = await fetchUserData(newSession.user);
                    if (userData && mounted) {
                      console.log('[AuthContext] KASPER FIX - Complete user data loaded, setting user:', userData);
                      console.log('[AuthContext] KASPER FIX - About to set user state with:', {
                        name: userData.name,
                        email: userData.email,
                        role: userData.role,
                        isKasper: userData.email === 'kasper.johansen@polygongroup.com',
                        isAdmin: userData.role === 'administrator'
                      });
                      setUser(userData);
                      setUserDataLoaded(true);
                    } else {
                      console.warn(`[AuthContext] KASPER FIX - No user data returned, using fallback`);
                      if (mounted) {
                        // Only use fallback if we can't get real data
                        const fallbackUser: AppUser = {
                          id: newSession.user.id,
                          name: newSession.user.email || 'System User',
                          email: newSession.user.email || '',
                          role: 'servicemedarbejder'
                        };
                        setUser(fallbackUser);
                        setUserDataLoaded(true);
                      }
                    }
                  } catch (error) {
                    console.error('[AuthContext] KASPER FIX - User data fetch failed:', error);
                    if (mounted) {
                      // Only set fallback user if fetch completely failed
                      const fallbackUser: AppUser = {
                        id: newSession.user.id,
                        name: newSession.user.email || 'System User',
                        email: newSession.user.email || '',
                        role: 'servicemedarbejder'
                      };
                      console.log('[AuthContext] KASPER FIX - Using fallback user due to error:', fallbackUser);
                      setUser(fallbackUser);
                      setUserDataLoaded(true);
                    }
                  }
                })();
              }, 0);
            } else {
              setUser(null);
              setUserDataLoaded(false);
            }

            // Mark initialization as complete after first state change
            if (!initializationComplete) {
              setLoading(false);
              setAuthInitialized(true);
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
              setAuthInitialized(true);
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
            setAuthInitialized(true);
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
          setAuthInitialized(true);
        }
      }
    };

    // Force completion after maximum timeout
    const forceCompleteTimeout = setTimeout(() => {
      if (mounted && !initializationComplete) {
        console.warn('[AuthContext] SESSION EXPIRATION FIX - Force completing auth initialization due to timeout');
        setLoading(false);
        setAuthInitialized(true);
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

  // Coordinate authReady with session and userDataLoaded to avoid race conditions
  useEffect(() => {
    if (!authInitialized) return;

    // If no session, we're ready immediately
    if (!session) {
      if (!authReady) setAuthReady(true);
      return;
    }

    // If authenticated, wait until user data is loaded
    if (session && userDataLoaded && !authReady) {
      setAuthReady(true);
    }
  }, [authInitialized, session, userDataLoaded, authReady]);

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
        title: t('auth.roleChanged') || "Rolle Ændret",
        description: t('auth.roleChangedTo', { role }) || `Skiftet til ${role}`,
      });
    }
  };

  // BRIAN REUS FIX: Enhanced refresh user data function with debug logging
  const refreshUserData = async (): Promise<void> => {
    if (!session?.user) {
      console.log('[AuthContext] BRIAN REUS DEBUG - No session user for refresh');
      return;
    }
    
    console.log(`[AuthContext] BRIAN REUS DEBUG - Refreshing user data for: ${session.user.email}`);
    try {
      const refreshedUser = await fetchUserData(session.user);
      if (refreshedUser) {
        console.log('[AuthContext] BRIAN REUS DEBUG - User data refreshed successfully:', refreshedUser);
        setUser(refreshedUser);
        setUserDataLoaded(true);
      } else {
        console.warn('[AuthContext] BRIAN REUS DEBUG - Refresh returned null user data');
      }
    } catch (error) {
      console.error('[AuthContext] BRIAN REUS DEBUG - Failed to refresh user data:', error);
    }
  };

  // AUTHENTICATION FIX: isAuthenticated based on session only, not user data
  const isAuthenticated = !!session;
  
  // Permissions based on current user (with demo role override)
  const currentRole = isDemoMode && demoRole ? demoRole : user?.role;
  const isAdmin = currentRole === 'administrator';
  const isSkadeleder = currentRole === 'skadeleder';  
  const isServicemedarbejder = currentRole === 'servicemedarbejder';

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
        title: t('auth.accessDenied') || "Access Denied",
        description: t('auth.adminRequired') || "You need administrator privileges for this action.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateSkadelederAccess = (): boolean => {
    if (!user || (user.role !== 'administrator' && user.role !== 'skadeleder')) {
      toast({
        title: t('auth.accessDenied') || "Access Denied",
        description: t('auth.skadelederRequired') || "You need skadeleder or administrator privileges for this action.",
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
    session,
    isAuthenticated,
    userDataLoaded,
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
