
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

// Login attempts tracking for rate limiting
const loginAttempts = new Map<string, { count: number, timestamp: number }>();

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  // Cache for user data to prevent repeated requests
  const userDataCache = useRef<Map<string, { data: AppUser; timestamp: number }>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Simplified initialization with better error handling
  const initializeUserData = useCallback(async (currentSession: Session) => {
    const userId = currentSession.user.id;
    const cacheKey = userId;
    
    // Check cache first
    const cached = userDataCache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[AuthProvider] Using cached user data');
      setUser(cached.data);
      setLoading(false);
      return;
    }

    try {
      console.log('[AuthProvider] Fetching user data for:', currentSession.user.email);
      
      // Fetch user data with simpler error handling
      const [roleResult, profileResult] = await Promise.allSettled([
        supabase.from('user_roles').select('role').eq('user_id', userId).single(),
        supabase.from('profiles').select('name').eq('id', userId).single()
      ]);

      let role: UserRole = 'servicemedarbejder';
      let name = currentSession.user.email || '';

      // Handle role result
      if (roleResult.status === 'fulfilled' && roleResult.value.data) {
        role = roleResult.value.data.role as UserRole;
      }

      // Handle profile result
      if (profileResult.status === 'fulfilled' && profileResult.value.data) {
        name = profileResult.value.data.name || name;
      }

      const appUser: AppUser = {
        id: userId,
        name,
        email: currentSession.user.email || '',
        role
      };

      // Cache the user data
      userDataCache.current.set(cacheKey, { data: appUser, timestamp: Date.now() });
      
      console.log('[AuthProvider] Successfully initialized user:', appUser);
      setUser(appUser);
    } catch (error) {
      console.error('[AuthProvider] Error initializing user data:', error);
      
      // Fallback user data
      const fallbackUser: AppUser = {
        id: userId,
        name: currentSession.user.email || '',
        email: currentSession.user.email || '',
        role: 'servicemedarbejder'
      };
      
      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Simplified auth state setup
  useEffect(() => {
    console.log('[AuthProvider] Setting up auth state listener');
    
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log('[AuthProvider] Auth state changed:', event);
        setSession(currentSession);
        
        if (currentSession?.user) {
          await initializeUserData(currentSession);
        } else {
          console.log('[AuthProvider] No session, clearing user state');
          setUser(null);
          setLoading(false);
          userDataCache.current.clear();
        }
      }
    );

    // Check for existing session
    const checkExistingSession = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthProvider] Session check error:', error);
          setLoading(false);
          return;
        }
        
        console.log('[AuthProvider] Initial session check:', existingSession?.user?.email || 'No session');
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
      }
    };
    
    checkExistingSession();
    
    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initializeUserData]);

  // Add loading timeout as safety net
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[AuthProvider] Loading timeout reached, forcing completion');
        setLoading(false);
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  // Define permissions based on roles
  const isAdmin = user?.role === 'administrator';
  const isSkadeleder = user?.role === 'skadeleder';
  const isServicemedarbejder = user?.role === 'servicemedarbejder';
  
  // Define complex permissions
  const canViewFuelCardCode = isAdmin;
  const canPublishTasks = isAdmin || isSkadeleder;
  const canApproveVacation = isAdmin;
  const canEdit = isAdmin || isSkadeleder;
  const canCreate = isAdmin || isSkadeleder;
  const canSeeUnpublishedTasks = isAdmin || isSkadeleder;
  
  const isAuthenticated = !!user;

  // Security methods for role validation
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

  // Authentication functions with simplified error handling
  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthProvider] Attempting login for:', email);
      
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
      
      console.log('[AuthProvider] Login response:', data?.user?.email, error?.message);
      
      if (!error) {
        loginAttempts.delete(email);
      }
      
      return { error: error ? error.message : null };
    } catch (error: any) {
      console.error('[AuthProvider] Login error:', error);
      return { error: 'An unexpected error occurred during login.' };
    }
  };

  // Simplified logout function
  const logout = async () => {
    try {
      console.log('[AuthProvider] Logging out');
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('[AuthProvider] Error during signOut:', error);
      }
      
      setUser(null);
      setSession(null);
      userDataCache.current.clear();
      
      console.log('[AuthProvider] Logout successful');
    } catch (error) {
      console.error('[AuthProvider] Logout error:', error);
      // Still clear local state even if there was an API error
      setUser(null);
      setSession(null);
      userDataCache.current.clear();
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      return { error: error ? error.message : null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: 'An unexpected error occurred during signup.' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Requesting password reset for:', email);
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
      console.error('User registration error:', error);
      return { error: 'An unexpected error occurred during registration.', user: null };
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      console.log('[AuthContext] Starting role update for user:', userId, 'to role:', role);
      
      if (!validateAdminAccess()) {
        return { error: 'Unauthorized - requires administrator role' };
      }
      
      console.log('[AuthContext] Calling admin-user-role edge function...');
      const { data, error: fnError } = await supabase.functions.invoke('admin-user-role', {
        body: { userId, role },
      });
      
      console.log('[AuthContext] Edge function response:', { data, error: fnError });
      
      if (fnError) {
        console.error('[AuthContext] Edge function error:', fnError);
        throw new Error(fnError.message || 'Failed to update user role');
      }
      
      // Clear cache for updated user
      userDataCache.current.delete(userId);
      
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Role update error:', error);
      return { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred during role update.'
      };
    }
  };

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
        throw new Error(fnError.message || 'Failed to reset password');
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
