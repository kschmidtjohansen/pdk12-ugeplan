
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from '@/utils/sessionManager';

export type UserRole = 'administrator' | 'skadeleder' | 'servicemedarbejder';

// Export the User type from Supabase
export type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userRole: string | null;
  isAdmin: boolean;
  isSkadeleder: boolean;
  canCreate: boolean;
  canPublishTasks: boolean;
  // Add missing authentication methods
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  adminResetPassword: (userId: string, newPassword: string) => Promise<{ error: any }>;
  updateUserRole: (userId: string, role: UserRole) => Promise<{ error: any }>;
}

interface PermissionsContextType {
  canCreate: boolean;
  canPublishTasks: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  // Add missing permission properties
  isAdmin: boolean;
  isSkadeleder: boolean;
  isServicemedarbejder: boolean;
  canEdit: boolean;
  canSeeUnpublishedTasks: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
        // Start session tracking when user is authenticated
        sessionManager.startSessionTracking();
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
        sessionManager.startSessionTracking();
      } else {
        setUserRole(null);
        sessionManager.stopSessionTracking();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole('servicemedarbejder'); // Default role
        return;
      }

      setUserRole(data?.role || 'servicemedarbejder');
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setUserRole('servicemedarbejder');
    }
  };

  const signOut = async () => {
    try {
      // Invalidate session before signing out
      await sessionManager.invalidateSession();
      sessionManager.stopSessionTracking();
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Add missing authentication methods
  const logout = signOut; // Alias for signOut

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const adminResetPassword = async (userId: string, newPassword: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId, newPassword }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase.functions.invoke('admin-user-role', {
        body: { userId, role }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const isAdmin = userRole === 'administrator';
  const isSkadeleder = userRole === 'skadeleder';
  const isServicemedarbejder = userRole === 'servicemedarbejder';
  const canCreate = isAdmin || isSkadeleder;
  const canPublishTasks = isAdmin || isSkadeleder;
  const canEdit = isAdmin || isSkadeleder;
  const canSeeUnpublishedTasks = isAdmin || isSkadeleder;
  const isAuthenticated = !!user;

  const permissions: PermissionsContextType = {
    canCreate: canCreate,
    canPublishTasks: canPublishTasks,
    canManageUsers: isAdmin,
    canViewReports: isAdmin || isSkadeleder,
    isAdmin,
    isSkadeleder,
    isServicemedarbejder,
    canEdit,
    canSeeUnpublishedTasks,
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
    userRole,
    isAdmin,
    isSkadeleder,
    canCreate,
    canPublishTasks,
    isAuthenticated,
    logout,
    resetPassword,
    adminResetPassword,
    updateUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      <PermissionsContext.Provider value={permissions}>
        {children}
      </PermissionsContext.Provider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within an AuthProvider');
  }
  return context;
};
