import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

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
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Set up authentication state
  useEffect(() => {
    console.log('Auth provider initializing');
    
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
  }, []);

  // Define permissions based on roles
  const isAdmin = user?.role === 'administrator';
  const isSkadeleder = user?.role === 'skadeleder';
  const isServicemedarbejder = user?.role === 'servicemedarbejder';
  
  // Define complex permissions
  // Updated to restrict fuel card access to administrators only
  const canViewFuelCardCode = isAdmin;
  const canPublishTasks = isAdmin || isSkadeleder;
  const canApproveVacation = isAdmin;
  const canEdit = isAdmin || isSkadeleder;
  const canCreate = isAdmin || isSkadeleder;
  const canSeeUnpublishedTasks = isAdmin || isSkadeleder;
  
  const isAuthenticated = !!user;

  // Authentication functions
  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      console.log('Login response:', data?.user?.email, error?.message);
      
      return { error: error ? error.message : null };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: 'An unexpected error occurred during login.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
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
  
  const requestPasswordReset = async (email: string) => {
    try {
      // Update to include the full URL path to the password reset page
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/password-reset',
      });
      return { error: error ? error.message : null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: 'An unexpected error occurred during password reset.' };
    }
  };

  // New functions for user management
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      return { error: error ? error.message : null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: 'An unexpected error occurred during password reset.' };
    }
  };

  const adminResetPassword = async (userId: string, newPassword: string) => {
    try {
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
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // Create the user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      
      if (error) throw error;
      
      return { error: null, user: data.user };
    } catch (error) {
      console.error('User registration error:', error);
      return { error: 'An unexpected error occurred during registration.', user: null };
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
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
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAdmin,
      isSkadeleder,
      isServicemedarbejder,
      login,
      logout,
      signUp,
      requestPasswordReset,
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
      canSeeUnpublishedTasks
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
    canSeeUnpublishedTasks
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
    canSeeUnpublishedTasks
  };
};
