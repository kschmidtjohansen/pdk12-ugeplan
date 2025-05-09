import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

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
  const [loading, setLoading] = useState<boolean>(true);
  
  // Set up authentication state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch the user's role
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          // Fetch the user's profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();
            
          if (!roleError && !profileError && roleData && profileData) {
            setUser({
              id: session.user.id,
              name: profileData.name || session.user.email || '',
              email: session.user.email || '',
              role: roleData.role as UserRole
            });
          } else {
            // If we can't get the role, set a default
            setUser({
              id: session.user.id,
              name: session.user.email || '',
              email: session.user.email || '',
              role: 'servicemedarbejder'
            });
            console.error('Error fetching user role or profile:', roleError, profileError);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Use setTimeout to avoid loading race conditions with onAuthStateChange
        setTimeout(async () => {
          // Fetch the user's role
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          // Fetch the user's profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();
            
          if (!roleError && !profileError && roleData && profileData) {
            setUser({
              id: session.user.id,
              name: profileData.name || session.user.email || '',
              email: session.user.email || '',
              role: roleData.role as UserRole
            });
          } else {
            // If we can't get the role, set a default
            setUser({
              id: session.user.id,
              name: session.user.email || '',
              email: session.user.email || '',
              role: 'servicemedarbejder'
            });
            console.error('Error fetching user role or profile:', roleError, profileError);
          }
          setLoading(false);
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Define permissions based on roles
  const isAdmin = user?.role === 'administrator';
  const isSkadeleder = user?.role === 'skadeleder';
  const isServicemedarbejder = user?.role === 'servicemedarbejder';
  
  // Define complex permissions
  const canViewFuelCardCode = isAdmin || isSkadeleder;
  const canPublishTasks = isAdmin || isSkadeleder;
  const canApproveVacation = isAdmin;
  const canEdit = isAdmin || isSkadeleder;
  const canCreate = isAdmin || isSkadeleder;
  const canSeeUnpublishedTasks = isAdmin || isSkadeleder;
  
  const isAuthenticated = !!user;

  // Authentication functions
  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      return { error: error ? error.message : null };
    } catch (error) {
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
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error ? error.message : null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: 'An unexpected error occurred during password reset.' };
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
