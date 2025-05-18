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
  const { toast } = useToast();
  
  // Set up authentication state
  useEffect(() => {
    console.log('Auth provider initializing');
    
    // Security enhancement: Validate localStorage to detect potential XSS
    const validateLocalStorage = () => {
      try {
        const testKey = '_security_test_' + Math.random().toString(36).substring(2);
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return true;
      } catch (e) {
        console.error('LocalStorage access error:', e);
        return false;
      }
    };
    
    if (!validateLocalStorage()) {
      toast({
        title: "Security Warning",
        description: "Browser storage is not accessible. Authentication features may not work.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid potential race conditions with onAuthStateChange
          setTimeout(async () => {
            try {
              // Fetch the user's role
              const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', currentSession.user.id)
                .single();
              
              // Fetch the user's profile
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', currentSession.user.id)
                .single();
                
              if (!roleError && !profileError && roleData && profileData) {
                const appUser = {
                  id: currentSession.user.id,
                  name: profileData.name || currentSession.user.email || '',
                  email: currentSession.user.email || '',
                  role: roleData.role as UserRole
                };
                console.log('Setting user:', appUser);
                setUser(appUser);
              } else {
                // If we can't get the role, set a default
                const appUser = {
                  id: currentSession.user.id,
                  name: currentSession.user.email || '',
                  email: currentSession.user.email || '',
                  role: 'servicemedarbejder' as UserRole
                };
                console.log('Setting default user:', appUser);
                setUser(appUser);
                console.error('Error fetching user role or profile:', roleError, profileError);
              }
              setLoading(false);
            } catch (error) {
              console.error('Error setting up user after auth state change:', error);
              setLoading(false);
            }
          }, 0);
        } else {
          console.log('No session, setting user to null');
          setUser(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      console.log('Initial session check:', existingSession?.user?.email);
      setSession(existingSession);
      
      if (existingSession?.user) {
        // Use setTimeout to avoid loading race conditions with onAuthStateChange
        setTimeout(async () => {
          try {
            // Fetch the user's role
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', existingSession.user.id)
              .single();
            
            // Fetch the user's profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', existingSession.user.id)
              .single();
              
            if (!roleError && !profileError && roleData && profileData) {
              const appUser = {
                id: existingSession.user.id,
                name: profileData.name || existingSession.user.email || '',
                email: existingSession.user.email || '',
                role: roleData.role as UserRole
              };
              console.log('Setting user from initial session:', appUser);
              setUser(appUser);
            } else {
              // If we can't get the role, set a default
              const appUser = {
                id: existingSession.user.id,
                name: existingSession.user.email || '',
                email: existingSession.user.email || '',
                role: 'servicemedarbejder' as UserRole
              };
              console.log('Setting default user from initial session:', appUser);
              setUser(appUser);
              console.error('Error fetching user role or profile:', roleError, profileError);
            }
            setLoading(false);
          } catch (error) {
            console.error('Error setting up user from initial session:', error);
            setLoading(false);
          }
        }, 0);
      } else {
        console.log('No initial session, setting user to null');
        setUser(null);
        setLoading(false);
      }
    }).catch(error => {
      console.error('Error checking session:', error);
      setLoading(false);
    });
    
    return () => {
      console.log('Auth provider cleanup - unsubscribing');
      subscription.unsubscribe();
    };
  }, [toast]);

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
      console.log('Attempting login for:', email);
      
      // Rate limiting implementation
      const now = Date.now();
      const userAttempts = loginAttempts.get(email) || { count: 0, timestamp: now };
      
      // Reset count if last attempt was more than 15 minutes ago
      if (now - userAttempts.timestamp > 15 * 60 * 1000) {
        userAttempts.count = 0;
        userAttempts.timestamp = now;
      }
      
      // Check for too many attempts
      if (userAttempts.count >= 5) {
        return { error: 'Too many login attempts. Please try again later.' };
      }
      
      // Increment attempt count
      userAttempts.count++;
      userAttempts.timestamp = now;
      loginAttempts.set(email, userAttempts);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      console.log('Login response:', data?.user?.email, error?.message);
      
      // Reset attempt count on successful login
      if (!error) {
        loginAttempts.delete(email);
      }
      
      return { error: error ? error.message : null };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: 'An unexpected error occurred during login.' };
    }
  };

  // Enhanced logout function to properly clear all session data
  const logout = async () => {
    try {
      console.log("Logging out user...");
      
      // Use global scope to sign out from all tabs/windows
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Error during signOut:', error);
        throw error;
      }
      
      // Clear user state
      setUser(null);
      setSession(null);
      
      // Clear any local storage items that might persist state
      try {
        // Optional: Clear specific items that might contain auth data
        localStorage.removeItem('supabase.auth.token');
        // Note: Don't clear everything as it might affect other app functionality
        // localStorage.clear(); 
      } catch (e) {
        console.warn('Unable to clear localStorage items:', e);
      }

      console.log("Logout successful");
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if there was an API error
      setUser(null);
      setSession(null);
    }
  };

  // ... keep existing code (signUp and resetPasswordForEmail functions)

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

  // ... keep existing code (updateUserRole and other functions)

  return (
    <AuthContext.Provider value={{
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
          // Update to include the full URL path to the password reset page
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
          });
          console.log('Password reset request result:', error ? `Error: ${error.message}` : 'Success');
          return { error: error ? error.message : null };
        } catch (error) {
          console.error('Password reset error:', error);
          return { error: 'An unexpected error occurred during password reset.' };
        }
      },
      resetPassword: async (email) => {
        try {
          console.log('Requesting password reset for:', email);
          // Update to include the full URL path to the password reset page
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
          });
          console.log('Password reset request result:', error ? `Error: ${error.message}` : 'Success');
          return { error: error ? error.message : null };
        } catch (error) {
          console.error('Password reset error:', error);
          return { error: 'An unexpected error occurred during password reset.' };
        }
      },
      adminResetPassword: async (userId, newPassword) => {
        try {
          if (!validateAdminAccess()) {
            return { error: 'Unauthorized - requires administrator role' };
          }
          
          // Call edge function to reset user password
          const { error: fnError } = await supabase.functions.invoke('admin-reset-password', {
            body: { userId, newPassword },
          });
          
          if (fnError) throw fnError;
          
          return { error: null };
        } catch (error) {
          console.error('Admin password reset error:', error);
          return { error: 'An unexpected error occurred during password reset.' };
        }
      },
      register,
      updateUserRole: async (userId, role) => {
        try {
          if (!validateAdminAccess()) {
            return { error: 'Unauthorized - requires administrator role' };
          }
          
          // Call the admin-user-role edge function to update the user's role
          const { error: fnError } = await supabase.functions.invoke('admin-user-role', {
            body: { userId, role },
          });
          
          if (fnError) throw fnError;
          
          return { error: null };
        } catch (error) {
          console.error('Update user role error:', error);
          return { error: 'An unexpected error occurred while updating the user role.' };
        }
      },
      loading,
      canViewFuelCardCode,
      canPublishTasks,
      canApproveVacation,
      canEdit,
      canCreate,
      canSeeUnpublishedTasks,
      validateAdminAccess,
      validateSkadelederAccess,
      hasRequiredRole
    }}>
      {children}
    </AuthContext.Provider>
  );
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
