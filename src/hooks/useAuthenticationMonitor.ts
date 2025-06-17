
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logSecurityEvent } from '@/utils/securityLogger';

interface AuthStatus {
  isAuthenticated: boolean;
  sessionValid: boolean;
  tokenExpiring: boolean;
  lastCheck: Date;
  connectionStatus: 'connected' | 'disconnected' | 'checking';
}

export const useAuthenticationMonitor = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    sessionValid: false,
    tokenExpiring: false,
    lastCheck: new Date(),
    connectionStatus: 'checking'
  });

  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthStatus(prev => ({ ...prev, connectionStatus: 'checking' }));
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AuthMonitor] Session check failed:', error);
        setAuthStatus(prev => ({
          ...prev,
          sessionValid: false,
          connectionStatus: 'disconnected',
          lastCheck: new Date()
        }));
        return false;
      }

      const isValid = !!session && !!session.user;
      const tokenExpiring = session ? 
        (new Date(session.expires_at * 1000).getTime() - Date.now()) < 5 * 60 * 1000 : // 5 minutes
        false;

      setAuthStatus({
        isAuthenticated: isValid,
        sessionValid: isValid,
        tokenExpiring,
        lastCheck: new Date(),
        connectionStatus: 'connected'
      });

      if (tokenExpiring && isValid) {
        console.log('[AuthMonitor] Token expiring soon, attempting refresh...');
        try {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('[AuthMonitor] Token refresh failed:', refreshError);
            logSecurityEvent(
              'auth_token_refresh_failed',
              'Failed to refresh expiring token',
              { error: refreshError.message },
              'warning'
            );
          } else {
            console.log('[AuthMonitor] Token refreshed successfully');
          }
        } catch (refreshError) {
          console.error('[AuthMonitor] Token refresh exception:', refreshError);
        }
      }

      return isValid;
    } catch (error) {
      console.error('[AuthMonitor] Auth status check failed:', error);
      setAuthStatus(prev => ({
        ...prev,
        sessionValid: false,
        connectionStatus: 'disconnected',
        lastCheck: new Date()
      }));
      return false;
    }
  }, []);

  const testDatabaseConnection = useCallback(async () => {
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }, []);

  // Monitor authentication status
  useEffect(() => {
    if (!isAuthenticated) return;

    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const performCheck = async () => {
      const authValid = await checkAuthStatus();
      const dbConnected = await testDatabaseConnection();
      
      if (!authValid) {
        console.warn('[AuthMonitor] Authentication invalid, user may need to re-login');
        logSecurityEvent(
          'auth_status_invalid',
          'User session became invalid',
          { user_id: user?.id, timestamp: new Date().toISOString() },
          'warning'
        );
      }
      
      if (!dbConnected) {
        console.warn('[AuthMonitor] Database connection failed');
        toast({
          title: 'Connection Issue',
          description: 'Database connection lost. Please check your internet connection.',
          variant: 'destructive'
        });
      }
    };

    // Initial check
    timeoutId = setTimeout(performCheck, 1000);
    
    // Regular checks every 2 minutes
    intervalId = setInterval(performCheck, 2 * 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isAuthenticated, user?.id, checkAuthStatus, testDatabaseConnection, toast]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthMonitor] Auth state change:', event);
        
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          await checkAuthStatus();
        }
        
        if (event === 'SIGNED_OUT') {
          logSecurityEvent(
            'auth_signed_out',
            'User signed out',
            { event, timestamp: new Date().toISOString() },
            'info'
          );
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuthStatus]);

  return {
    authStatus,
    checkAuthStatus,
    testDatabaseConnection
  };
};
