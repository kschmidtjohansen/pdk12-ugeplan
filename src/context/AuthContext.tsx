import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { DemoUserService } from '@/services/demoUserService';
import { circuitBreaker } from '@/services/circuitBreakerService';
import { TranslationContext } from './TranslationContext';
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';
import { unifiedDataService } from '@/services/data/unifiedDataService';
import { OptimizedAssignmentService } from '@/services/optimizedAssignmentService';
import { enhancedDataFetching } from '@/services/enhancedDataFetching';

// Define user roles
export type UserRole = 'super_admin' | 'administrator' | 'skadeleder' | 'servicemedarbejder' | 'vikar';

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
  isPendingApproval: boolean;
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
  isPendingApproval: false,
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
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [isPendingApproval, setIsPendingApproval] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const manualLogoutRef = useRef(false);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Safe translation hook with fallback. Stored in a ref so the auth-init effect
  // does not re-subscribe every time TranslationContext re-renders.
  const translationContext = useContext(TranslationContext);
  const t = (translationContext?.t || ((key: string) => key)) as (key: string, params?: Record<string, any>) => string;
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);
  
  // Demo mode detection
  const demoService = DemoUserService.getInstance();
  const isDemoMode = user ? demoService.isDemoUser(user.email) : false;

  // Store demo mode in sessionStorage for quick access across the app
  useEffect(() => {
    if (user?.email === 'test@polygongroup.com') {
      sessionStorage.setItem('demo-mode', 'true');
    } else {
      sessionStorage.removeItem('demo-mode');
    }
  }, [user]);

  // Circuit breaker for auth operations
  const AUTH_OPERATION_ID = 'auth_initialization';

  // User data fetching
  const fetchUserData = async (authUser: User): Promise<AppUser | null> => {
    const startTime = Date.now();
    if (import.meta.env.DEV) console.log(`[AuthContext] Starting user data fetch for: ${authUser.email}`);
    
    if (!circuitBreaker.canProceed(`user_data_fetch_${authUser.id}`)) {
      if (import.meta.env.DEV) console.warn(`[AuthContext] Circuit breaker open for user data fetch`);
      return null;
    }
    
    try {
      const isDemoUser = authUser.email === 'test@polygongroup.com';
      
      if (isDemoUser) {
        try {
          const { data: demoProfiles, error: demoError } = await rpcWithRefresh(
            'get_demo_profiles_admin_detailed', { full_access: false });
          
          if (demoError) {
            if (import.meta.env.DEV) console.error(`[AuthContext] Demo profile fetch error:`, demoError.message);
            throw new Error(`Demo profile fetch failed: ${demoError.message}`);
          }
          
          const userProfile = demoProfiles?.find((p: any) => p.id === authUser.id);
          
          if (!userProfile) {
            return {
              id: authUser.id,
              name: 'Demo User',
              email: authUser.email || '',
              role: 'administrator'
            };
          }
          
          return {
            id: authUser.id,
            name: userProfile.name || 'Demo User',
            email: authUser.email || '',
            role: (userProfile.role as UserRole) || 'administrator'
          };
        } catch (demoError) {
          if (import.meta.env.DEV) console.error('[AuthContext] Demo user profile error:', demoError instanceof Error ? demoError.message : 'Unknown error');
          
          return {
            id: authUser.id,
            name: 'Demo User',
            email: authUser.email || 'test@polygongroup.com',
            role: 'administrator'
          };
        }
      }
      
      // For non-demo users, fetch from public schema
      if (import.meta.env.DEV) console.log(`[AuthContext] Fetching production profile for:`, authUser.email);
      
      const fetchPromise = Promise.all([
        supabase.from('profiles').select('id, name, email').eq('id', authUser.id).maybeSingle(),
        supabase.from('user_roles').select('user_id, role').eq('user_id', authUser.id).maybeSingle()
      ]);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User data fetch timeout')), 5000)
      );

      const [profileResult, roleResult] = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (import.meta.env.DEV) {
        console.log(`[AuthContext] Database queries completed in ${Date.now() - startTime}ms`);
        if (import.meta.env.DEV) console.log(`[AuthContext] Profile:`, profileResult?.data?.name, `Role:`, roleResult?.data?.role);
      }

      if (profileResult.error) {
        if (import.meta.env.DEV) console.error(`[AuthContext] Profile fetch error:`, profileResult.error.message);
        throw new Error(`Profile fetch failed: ${profileResult.error.message}`);
      }
      
      if (roleResult.error) {
        if (import.meta.env.DEV) console.error(`[AuthContext] Role fetch error:`, roleResult.error.message);
        throw new Error(`Role fetch failed: ${roleResult.error.message}`);
      }

      let name: string;
      if (profileResult.data?.name) {
        name = profileResult.data.name;
      } else if (authUser.email) {
        name = authUser.email;
      } else {
        name = 'Unknown User';
      }
      
      let role: UserRole = 'servicemedarbejder';
      if (roleResult.data?.role) {
        role = roleResult.data.role as UserRole;
      }

      const enhancedUser: AppUser = {
        id: authUser.id,
        name,
        email: authUser.email || '',
        role
      };

      if (import.meta.env.DEV) {
        console.log(`[AuthContext] User loaded:`, enhancedUser.name, enhancedUser.role, `(${Date.now() - startTime}ms)`);
      }

      // Cache last known user name for personalized greeting on the login page next time.
      try {
        if (enhancedUser.name) localStorage.setItem('last_user_name', enhancedUser.name);
        if (enhancedUser.email) localStorage.setItem('last_user_email', enhancedUser.email);
      } catch {
        // ignore storage errors (private mode etc.)
      }

      circuitBreaker.recordSuccess(`user_data_fetch_${authUser.id}`);
      return enhancedUser;
      
    } catch (error) {
      if (import.meta.env.DEV) console.error(`[AuthContext] User data fetch failed after ${Date.now() - startTime}ms:`, error instanceof Error ? error.message : 'Unknown error');
      circuitBreaker.recordFailure(`user_data_fetch_${authUser.id}`);
      
      const isDemoUser = authUser.email === DemoUserService.DEMO_USER_EMAIL;
      const fallbackRole: UserRole = isDemoUser ? 'administrator' : 'servicemedarbejder';
      
      const fallbackUser: AppUser = {
        id: authUser.id,
        name: isDemoUser ? 'Demo User' : (authUser.email || 'System User'),
        email: authUser.email || '',
        role: fallbackRole
      };
      
      return fallbackUser;
    }
  };

  // Auth initialization with session expiration handling
  useEffect(() => {
    let mounted = true;
    let initializationComplete = false;

    if (import.meta.env.DEV) console.log('[AuthContext] Starting authentication initialization...');

    if (!circuitBreaker.canProceed(AUTH_OPERATION_ID)) {
      if (import.meta.env.DEV) console.warn('[AuthContext] Auth initialization circuit breaker is open');
      setLoading(false);
      setAuthReady(true);
      return;
    }

    const initializeAuth = async () => {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mounted) return;

            if (import.meta.env.DEV) console.log('[AuthContext] Auth state change:', event, !!newSession?.user);
            
            // Handle session expiration
            if (event === 'SIGNED_OUT' && session && !newSession) {
              const wasManualLogout = manualLogoutRef.current;
              
              setSessionExpired(!wasManualLogout);
              setUser(null);
              setSession(null);
              
              if (wasManualLogout) {
                manualLogoutRef.current = false;
              } else {
                toastRef.current({
                  title: tRef.current('auth.sessionExpiredTitle') || 'Session Expired',
                  description: tRef.current('auth.sessionExpiredDescription') || 'Please log in again',
                  variant: "destructive",
                });
                
                sessionStorage.clear();
                
                // Use replace (not href) to avoid history pollution and skip the 1s delay
                if (window.location.pathname !== '/login') {
                  window.location.replace('/login');
                }
              }
              
              return;
            }
            
            // Handle token refresh events
            if (event === 'TOKEN_REFRESHED' && newSession) {
              setSession(newSession);
              setSessionExpired(false);
              return;
            }
            
            // Handle successful sign in
            if (event === 'SIGNED_IN' && newSession) {
              setSession(newSession);
              setSessionExpired(false);
              // Record login time for 180-min session timeout
              sessionStorage.setItem('session_start_time', String(Date.now()));
              return;
            }
            
            setSession(newSession);
            setSessionExpired(false);
            
            if (newSession?.user) {
              if (import.meta.env.DEV) console.log(`[AuthContext] Starting user data fetch for:`, newSession.user.email);
              setUser(null);
              setUserDataLoaded(false);
              
              (async () => {
                if (!mounted) return;
                
                try {
                  const userData = await fetchUserData(newSession.user);
                  if (userData && mounted) {
                    if (import.meta.env.DEV) console.log('[AuthContext] Complete user data loaded:', userData.name, userData.role);
                    setUser(userData);

                    // Check pending-approval state for non-demo users
                    if (newSession.user.email !== DemoUserService.DEMO_USER_EMAIL) {
                      try {
                        const { data: isPending } = await supabase.rpc('is_pending_user', {
                          _user_id: newSession.user.id,
                        });
                        if (mounted) {
                          setIsPendingApproval(!!isPending);
                          if (isPending) {
                            // Notify super_admins once per user (idempotent on server side)
                            const flagKey = `pending_notified_${newSession.user.id}`;
                            if (!localStorage.getItem(flagKey)) {
                              try {
                                await supabase.rpc('notify_admins_of_pending_user', {
                                  _email: newSession.user.email || '',
                                  _name: userData.name || newSession.user.email || '',
                                });
                                localStorage.setItem(flagKey, '1');
                              } catch {
                                // non-fatal
                              }
                            }
                          }
                        }
                      } catch {
                        // non-fatal — keep previous state
                      }
                    } else if (mounted) {
                      setIsPendingApproval(false);
                    }

                    setTimeout(() => {
                      if (mounted) {
                        setUserDataLoaded(true);
                      }
                    }, 100);
                  } else {
                    if (mounted) {
                      const fallbackUser: AppUser = {
                        id: newSession.user.id,
                        name: newSession.user.email || 'System User',
                        email: newSession.user.email || '',
                        role: 'servicemedarbejder'
                      };
                      setUser(fallbackUser);
                      setTimeout(() => {
                        if (mounted) {
                          setUserDataLoaded(true);
                        }
                      }, 200);
                    }
                  }
                } catch (error) {
                  if (import.meta.env.DEV) console.error('[AuthContext] User data fetch failed:', error instanceof Error ? error.message : 'Unknown error');
                  if (mounted) {
                    const fallbackUser: AppUser = {
                      id: newSession.user.id,
                      name: newSession.user.email || 'System User',
                      email: newSession.user.email || '',
                      role: 'servicemedarbejder'
                    };
                    setUser(fallbackUser);
                    setTimeout(() => {
                      if (mounted) {
                        setUserDataLoaded(true);
                      }
                    }, 100);
                  }
                }
              })();
            } else {
              setUser(null);
              setUserDataLoaded(false);
              setIsPendingApproval(false);
            }

            if (!initializationComplete) {
              setLoading(false);
              setAuthReady(true);
              initializationComplete = true;
            }
          }
        );

        if (import.meta.env.DEV) console.log('[AuthContext] Checking for existing session...');
        
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
            if (import.meta.env.DEV) console.error('[AuthContext] Session check error:', error.message);
            throw error;
          }

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
          if (import.meta.env.DEV) console.error('[AuthContext] Session check failed:', error instanceof Error ? error.message : 'Unknown error');
          circuitBreaker.recordFailure(AUTH_OPERATION_ID);
          
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
        if (import.meta.env.DEV) console.error('[AuthContext] Auth initialization failed:', error instanceof Error ? error.message : 'Unknown error');
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
        if (import.meta.env.DEV) console.warn('[AuthContext] Force completing auth initialization due to timeout');
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
  }, []);

  // Demo role management (simplified)
  useEffect(() => {
    if (isDemoMode && user) {
      const savedDemoRole = sessionStorage.getItem('demo-role') as UserRole | null;
      
      if (savedDemoRole && ['super_admin', 'administrator', 'skadeleder', 'servicemedarbejder'].includes(savedDemoRole)) {
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

  // 180-minute session timeout — auto-logout with cache clearing
  const SESSION_TIMEOUT_MS = 180 * 60 * 1000; // 180 minutes

  useEffect(() => {
    // Only for authenticated non-demo users
    if (!session || !user || isDemoMode) {
      // Clear any existing timer
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      return;
    }

    // Record login time if not already set
    if (!sessionStorage.getItem('session_start_time')) {
      sessionStorage.setItem('session_start_time', String(Date.now()));
    }

    // Check every 60 seconds if session has exceeded 180 minutes
    sessionTimerRef.current = setInterval(() => {
      const startTime = Number(sessionStorage.getItem('session_start_time'));
      if (startTime && Date.now() - startTime >= SESSION_TIMEOUT_MS) {
        if (import.meta.env.DEV) console.log('[AuthContext] 180-minute session timeout reached — logging out');
        
        toast({
          title: t('auth.sessionTimedOut') || 'Session udløbet',
          description: t('auth.sessionTimedOutDescription') || 'Din session er automatisk afsluttet efter 180 minutter.',
          variant: 'destructive',
        });

        // Use the existing logout which clears all caches
        logout();
      }
    }, 60_000);

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [session, user, isDemoMode]);

  // Handle demo role changes
  const handleSetDemoRole = (role: UserRole) => {
    if (isDemoMode && user) {
      if (import.meta.env.DEV) console.log(`[Demo] Role switching from ${demoRole || user.role} to ${role}`);
      setDemoRole(role);
      sessionStorage.setItem('demo-role', role);
      
      const roleLabel = t(`common.roles.${role}`) || role;
      toast({
        title: t('common.roleChanged') || "Rolle Ændret",
        description: (t('common.roleChangedTo') || 'Skiftet til {role}').replace('{role}', roleLabel),
      });
    }
  };

  // Refresh user data
  const refreshUserData = async (): Promise<void> => {
    if (!session?.user) return;
    
    try {
      const refreshedUser = await fetchUserData(session.user);
      if (refreshedUser) {
        setUser(refreshedUser);
        setUserDataLoaded(true);
        // Re-check pending state
        if (session.user.email !== DemoUserService.DEMO_USER_EMAIL) {
          try {
            const { data: isPending } = await supabase.rpc('is_pending_user', {
              _user_id: session.user.id,
            });
            setIsPendingApproval(!!isPending);
          } catch {
            // ignore
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[AuthContext] Failed to refresh user data:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // isAuthenticated based on session only, not user data
  const isAuthenticated = !!session;
  
  // Permissions based on current user (with demo role override)
  const currentRole = isDemoMode && demoRole ? demoRole : user?.role;
  const isSuperAdmin = currentRole === 'super_admin';
  const isAdmin = currentRole === 'administrator' || isSuperAdmin;
  const isSkadeleder = currentRole === 'skadeleder';  
  const isServicemedarbejder = currentRole === 'servicemedarbejder';

  // Effective role permissions (considering demo mode) - super_admin has all admin rights
  const isEffectiveAdmin = currentRole === 'administrator' || currentRole === 'super_admin';
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
    if (!user || (user.role !== 'administrator' && user.role !== 'super_admin')) {
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
    if (!user || (user.role !== 'administrator' && user.role !== 'super_admin' && user.role !== 'skadeleder')) {
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

  // Login method
  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) {
        if (import.meta.env.DEV) console.error('[AuthProvider] Login error:', error.message);
        return { error: error.message };
      }
      
      toast({
        title: "Login Succesfuld",
        description: "Du er nu logget ind.",
      });

      return { error: null };
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('[AuthProvider] Login exception:', error instanceof Error ? error.message : 'Unknown error');
      return { error: 'An unexpected error occurred during login.' };
    }
  };

  // Logout method with session expiration support
  const logout = async () => {
    try {
      // Mark as manual logout to prevent "session expired" toast
      manualLogoutRef.current = true;
      
      // Clean up demo data if in demo mode
      if (isDemoMode) {
        await demoService.cleanupDemoData();
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setSessionExpired(false);
      setIsPendingApproval(false);
      
      // 1. TanStack Query -- ryd al cached data
      queryClient.clear();

      // 2. Service-caches
      unifiedDataService.clearCache();
      OptimizedAssignmentService.clearCache();
      enhancedDataFetching.clearCache();

      // 3. SessionStorage -- ryd alt
      sessionStorage.clear();

      // 4. LocalStorage -- ryd app-specifikke noegler (bevar theme)
      const keysToRemove = [
        'selected_department_id',
        'selected_department_name',
        'selected_sub_department_id',
        'selected_view',
        'last-redirect-time',
        'redirect-attempts',
      ];
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (keysToRemove.includes(key)) {
          localStorage.removeItem(key);
        }
      }
      
    } catch (error) {
      if (import.meta.env.DEV) console.error('[AuthProvider] Logout error:', error instanceof Error ? error.message : 'Unknown error');
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
          emailRedirectTo: `${window.location.origin}/login`,
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
      
      if (error) {
        return { error: error.message || 'Failed to create user', user: null };
      }
      if (!data?.user) {
        return { error: data?.error || 'Failed to create user', user: null };
      }
      
      return { error: null, user: data.user };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'An unexpected error occurred during registration.',
        user: null,
      };
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
    isPendingApproval,
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
