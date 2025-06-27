import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  // Add permissions getters
  canViewFuelCardCode: boolean;
  canPublishTasks: boolean;
  canApproveVacation: boolean;
  // Existing checks for permissions
  canEdit: boolean;
  canCreate: boolean;
  canSeeUnpublishedTasks: boolean;
  // New validation methods for security
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

// Login attempts tracking for rate limiting
const loginAttempts = new Map<string, { count: number, timestamp: number }>();

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initializationAttempts, setInitializationAttempts] = useState<number>(0);
  const { toast } = useToast();
  
  // Session timeout states - Updated to 20 minutes
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityListenersAttached = useRef<boolean>(false);
  
  const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 minutes in milliseconds (was 5 minutes)
  const WARNING_TIME = 30 * 1000; // 30 seconds before logout
  
  // Reset activity timer
  const resetActivityTimer = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    
    // Clear existing timers
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Only set timers if user is authenticated
    if (user) {
      // Set warning timer (19.5 minutes)
      warningTimeoutRef.current = setTimeout(() => {
        toast({
          title: "Session Warning",
          description: "Your session will expire in 30 seconds due to inactivity.",
          variant: "destructive",
        });
      }, SESSION_TIMEOUT - WARNING_TIME);
      
      // Set logout timer (20 minutes)
      sessionTimeoutRef.current = setTimeout(() => {
        console.log('[AuthProvider] Session expired due to inactivity after 20 minutes');
        toast({
          title: "Session Expired",
          description: "You have been logged out due to inactivity after 20 minutes.",
          variant: "destructive",
        });
        logout();
      }, SESSION_TIMEOUT);
    }
  }, [user, toast]);
  
  // Activity event handler
  const handleActivity = useCallback(() => {
    resetActivityTimer();
  }, [resetActivityTimer]);
  
  // Set up activity listeners
  useEffect(() => {
    if (user && !activityListenersAttached.current) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      events.forEach(event => {
        document.addEventListener(event, handleActivity, { passive: true });
      });
      
      activityListenersAttached.current = true;
      resetActivityTimer(); // Start the timer
      
      console.log('[AuthProvider] Activity listeners attached');
    } else if (!user && activityListenersAttached.current) {
      // Remove listeners when user logs out
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      activityListenersAttached.current = false;
      
      // Clear timers
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      
      console.log('[AuthProvider] Activity listeners removed');
    }
    
    // Cleanup function
    return () => {
      if (activityListenersAttached.current) {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
          document.removeEventListener(event, handleActivity);
        });
        activityListenersAttached.current = false;
      }
      
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [user, handleActivity, resetActivityTimer]);

  // Enhanced initialization with retry mechanism for production domains
  const initializeUserData = async (currentSession: Session, attempt: number = 1) => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, attempt) * 1000; // Exponential backoff
    
    try {
      console.log(`[AuthProvider] Initializing user data - attempt ${attempt} for domain: ${window.location.hostname}`);
      
      // Add timeout for database queries
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      );
      
      // Fetch the user's role with timeout
      const rolePromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentSession.user.id)
        .single();
      
      // Fetch the user's profile with timeout
      const profilePromise = supabase
        .from('profiles')
        .select('name')
        .eq('id', currentSession.user.id)
        .single();
      
      const [roleResult, profileResult] = await Promise.race([
        Promise.all([rolePromise, profilePromise]),
        timeoutPromise
      ]) as [any, any];
      
      const { data: roleData, error: roleError } = roleResult;
      const { data: profileData, error: profileError } = profileResult;
      
      if (!roleError && !profileError && roleData && profileData) {
        const appUser = {
          id: currentSession.user.id,
          name: profileData.name || currentSession.user.email || '',
          email: currentSession.user.email || '',
          role: roleData.role as UserRole
        };
        console.log(`[AuthProvider] Successfully set user:`, appUser);
        setUser(appUser);
        setLoading(false);
        return true;
      } else {
        // If we can't get the role, set a default but log the issue
        console.warn(`[AuthProvider] Using default role due to errors - Role error:`, roleError, 'Profile error:', profileError);
        const appUser = {
          id: currentSession.user.id,
          name: currentSession.user.email || '',
          email: currentSession.user.email || '',
          role: 'servicemedarbejder' as UserRole
        };
        setUser(appUser);
        setLoading(false);
        return true;
      }
    } catch (error) {
      console.error(`[AuthProvider] Error on attempt ${attempt}:`, error);
      
      if (attempt < maxRetries) {
        console.log(`[AuthProvider] Retrying initialization in ${retryDelay}ms...`);
        setTimeout(() => {
          initializeUserData(currentSession, attempt + 1);
        }, retryDelay);
        return false;
      } else {
        console.error(`[AuthProvider] Failed to initialize after ${maxRetries} attempts`);
        // Set basic user data as fallback
        const fallbackUser = {
          id: currentSession.user.id,
          name: currentSession.user.email || '',
          email: currentSession.user.email || '',
          role: 'servicemedarbejder' as UserRole
        };
        setUser(fallbackUser);
        setLoading(false);
        
        // Show user-friendly error for production domains
        if (window.location.hostname.includes('pdk12.dk')) {
          toast({
            title: "Connection Issue",
            description: "Having trouble loading user data. Please refresh the page.",
            variant: "destructive",
          });
        }
        return false;
      }
    }
  };
  
  // Set up authentication state with enhanced error handling
  useEffect(() => {
    console.log(`[AuthProvider] Initializing on domain: ${window.location.hostname}`);
    
    // Enhanced localStorage validation for production domains
    const validateStorage = () => {
      try {
        const testKey = '_auth_test_' + Math.random().toString(36).substring(2);
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return true;
      } catch (e) {
        console.error('[AuthProvider] LocalStorage access error:', e);
        return false;
      }
    };
    
    if (!validateStorage()) {
      toast({
        title: "Storage Warning",
        description: "Browser storage is not accessible. Please check your browser settings.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    let mounted = true;
    
    // Set up auth state listener with enhanced error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log(`[AuthProvider] Auth state changed: ${event} on domain: ${window.location.hostname}`);
        setSession(currentSession);
        
        if (currentSession?.user) {
          await initializeUserData(currentSession);
        } else {
          console.log('[AuthProvider] No session, clearing user state');
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session with timeout
    const checkExistingSession = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 8000)
        );
        
        const { data: { session: existingSession }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (error) {
          console.error('[AuthProvider] Session check error:', error);
          setLoading(false);
          return;
        }
        
        console.log(`[AuthProvider] Initial session check on ${window.location.hostname}:`, existingSession?.user?.email || 'No session');
        setSession(existingSession);
        
        if (existingSession?.user && mounted) {
          await initializeUserData(existingSession);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('[AuthProvider] Session initialization failed:', error);
        setLoading(false);
        
        // Show error for production domains
        if (window.location.hostname.includes('pdk12.dk')) {
          toast({
            title: "Loading Issue",
            description: "Having trouble connecting. Please refresh the page.",
            variant: "destructive",
          });
        }
      }
    };
    
    checkExistingSession();
    
    // Cleanup function
    return () => {
      mounted = false;
      console.log('[AuthProvider] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [toast]);

  // Add loading timeout as safety net
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[AuthProvider] Loading timeout reached, forcing completion');
        setLoading(false);
        
        if (window.location.hostname.includes('pdk12.dk')) {
          toast({
            title: "Loading Timeout",
            description: "App took too long to load. Please refresh the page.",
            variant: "destructive",
          });
        }
      }
    }, 15000); // 15 second timeout
    
    return () => clearTimeout(loadingTimeout);
  }, [loading, toast]);

  // Define permissions based on roles
  const isAdmin = user?.role === 'administrator';
  const isSkadeleder = user?.role === 'skadeleder';
  const isServicemedarbejder = user?.role === 'servicemedarbejder';
  
  // Define complex permissions
  // Updated to restrict fuel card access to administrators only
  const canViewFuelCardCode = isAdmin;
  const canPublishTasks = isAdmin || isSkadeleder;
  const canApproveVacation = isAdmin; // Only admins can approve/reject vacations
  const canEdit = isAdmin || isSkadeleder;
  const canCreate = isAdmin || isSkadeleder;
  const canSeeUnpublishedTasks = isAdmin || isSkadeleder;
  
  const isAuthenticated = !!user;

  // New security methods for role validation
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

  // Authentication functions with rate limiting
  const login = async (email: string, password: string) => {
    try {
      console.log(`[AuthProvider] Attempting login for: ${email} on domain: ${window.location.hostname}`);
      
      const now = Date.now();
      const userAttempts = loginAttempts.get(email) || { count: 0, timestamp: now };
      
      if (now - userAttempts.timestamp > 15 * 60 * 1000) {
        userAttempts.count = 0;
        userAttempts.timestamp = now;
      }
      
      if (userAttempts.count >= 5) {
        return { error: 'Too many login attempts. Please try again later.' };
      }
      
      userAttempts.count++;
      userAttempts.timestamp = now;
      loginAttempts.set(email, userAttempts);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      console.log(`[AuthProvider] Login response on ${window.location.hostname}:`, data?.user?.email, error?.message);
      
      if (!error) {
        loginAttempts.delete(email);
      }
      
      return { error: error ? error.message : null };
    } catch (error: any) {
      console.error('[AuthProvider] Login error:', error);
      return { error: 'An unexpected error occurred during login.' };
    }
  };

  // Enhanced logout function to properly clear all session data
  const logout = async () => {
    try {
      console.log(`[AuthProvider] Logging out on domain: ${window.location.hostname}`);
      
      // Clear session timeout timers
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('[AuthProvider] Error during signOut:', error);
        throw error;
      }
      
      setUser(null);
      setSession(null);
      
      try {
        localStorage.removeItem('supabase.auth.token');
      } catch (e) {
        console.warn('[AuthProvider] Unable to clear localStorage items:', e);
      }

      console.log(`[AuthProvider] Logout successful on ${window.location.hostname}`);
    } catch (error) {
      console.error('[AuthProvider] Logout error:', error);
      // Still clear local state even if there was an API error
      setUser(null);
      setSession(null);
    }
  };

  const signUp = async (email, password, name) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name // Store name in user metadata
          }
        }
      });
      
      return { error: error ? error.message : null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: 'An unexpected error occurred during signup.' };
    }
  };

  const resetPassword = async (email) => {
    try {
      console.log('Requesting password reset for:', email);
      // Add full URL with origin to ensure proper redirect
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset`,
      });
      console.log('Password reset request result:', error ? `Error: ${error.message}` : 'Success');
      return { error: error ? error.message : null };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { error: 'An unexpected error occurred during password reset.' };
    }
  };

  // Modified register function to avoid affecting the current admin's session
  const register = async (email: string, password: string, name: string) => {
    try {
      // Create the user account via the edge function instead of direct signup
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
      console.error('User registration error:', error);
      return { error: 'An unexpected error occurred during registration.', user: null };
    }
  };

  // Enhanced updateUserRole function with better error handling
  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      console.log('[AuthContext] Starting role update for user:', userId, 'to role:', role);
      
      if (!validateAdminAccess()) {
        return { error: 'Unauthorized - requires administrator role' };
      }
      
      // Call the admin-user-role edge function to update the user's role
      console.log('[AuthContext] Calling admin-user-role edge function...');
      const { data, error: fnError } = await supabase.functions.invoke('admin-user-role', {
        body: { userId, role },
      });
      
      console.log('[AuthContext] Edge function response:', { data, error: fnError });
      
      if (fnError) {
        console.error('[AuthContext] Edge function error:', fnError);
        
        // Handle specific error types from the edge function
        if (fnError.message?.includes('Failed to send a request')) {
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        } else if (fnError.message?.includes('Not authenticated') || fnError.message?.includes('Invalid authentication')) {
          throw new Error('Authentication expired. Please refresh the page and try again.');
        } else if (fnError.message?.includes('Insufficient privileges')) {
          throw new Error('You do not have permission to update user roles.');
        } else if (fnError.message?.includes('Origin not allowed')) {
          throw new Error('Request not allowed from this domain.');
        } else {
          throw new Error(fnError.message || 'Failed to update user role');
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Role update error:', error);
      return { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred during role update.'
      };
    }
  };

  // Enhanced adminResetPassword function
  const adminResetPassword = async (userId: string, newPassword: string) => {
    try {
      console.log('[AuthContext] Starting admin password reset for user:', userId);
      
      if (!validateAdminAccess()) {
        return { error: 'Unauthorized - requires administrator role' };
      }
      
      // Validate password on frontend first
      if (newPassword.length < 8) {
        return { error: 'Password must be at least 8 characters long' };
      }
      if (!/[A-Z]/.test(newPassword)) {
        return { error: 'Password must contain at least one uppercase letter' };
      }
      if (!/[a-z]/.test(newPassword)) {
        return { error: 'Password must contain at least one lowercase letter' };
      }
      if (!/[0-9]/.test(newPassword)) {
        return { error: 'Password must contain at least one number' };
      }
      
      console.log('[AuthContext] Calling admin-reset-password edge function...');
      const { data, error: fnError } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId, newPassword },
      });
      
      console.log('[AuthContext] Edge function response:', { data, error: fnError });
      
      if (fnError) {
        console.error('[AuthContext] Edge function error:', fnError);
        
        // Handle specific error types from the edge function
        if (fnError.message?.includes('Failed to send a request') || fnError.message?.includes('FunctionsNetworkError')) {
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        } else if (fnError.message?.includes('Not authenticated') || fnError.message?.includes('Invalid authentication')) {
          throw new Error('Authentication expired. Please refresh the page and try again.');
        } else if (fnError.message?.includes('Insufficient privileges')) {
          throw new Error('You do not have permission to reset passwords.');
        } else if (fnError.message?.includes('Origin not allowed') || fnError.message?.includes('Forbidden origin')) {
          throw new Error('Request not allowed from this domain.');
        } else if (fnError.message?.includes('Password must')) {
          throw new Error(fnError.message); // Pass through password validation errors
        } else {
          throw new Error(fnError.message || 'Failed to reset password');
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Password reset error:', error);
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
    signUp: async (email, password, name) => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name // Store name in user metadata
            }
          }
        });
        
        return { error: error ? error.message : null };
      } catch (error) {
        console.error('Signup error:', error);
        return { error: 'An unexpected error occurred during signup.' };
      }
    },
    requestPasswordReset: async (email) => {
      try {
        console.log('Requesting password reset for:', email);
        // Add full URL with origin to ensure proper redirect
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/password-reset`,
        });
        console.log('Password reset request result:', error ? `Error: ${error.message}` : 'Success');
        return { error: error ? error.message : null };
      } catch (error: any) {
        console.error('Password reset error:', error);
        return { error: 'An unexpected error occurred during password reset.' };
      }
    },
    resetPassword: async (email) => {
      try {
        console.log('Requesting password reset for:', email);
        // Add full URL with origin to ensure proper redirect
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/password-reset`,
        });
        console.log('Password reset request result:', error ? `Error: ${error.message}` : 'Success');
        return { error: error ? error.message : null };
      } catch (error: any) {
        console.error('Password reset error:', error);
        return { error: 'An unexpected error occurred during password reset.' };
      }
    },
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
