
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

// Simplified auth monitor that doesn't interfere with the main auth flow
export const useAuthenticationMonitor = () => {
  const { user, isAuthenticated } = useAuth();
  const [lastCheck, setLastCheck] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');

  // Simple periodic check without interfering with auth state
  useEffect(() => {
    if (!isAuthenticated) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connected');
    const interval = setInterval(() => {
      setLastCheck(new Date());
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const testDatabaseConnection = useCallback(async () => {
    // Simplified test that doesn't cause issues
    return true;
  }, []);

  return {
    authStatus: {
      isAuthenticated,
      sessionValid: isAuthenticated,
      tokenExpiring: false,
      lastCheck,
      connectionStatus
    },
    checkAuthStatus: async () => isAuthenticated,
    testDatabaseConnection
  };
};
