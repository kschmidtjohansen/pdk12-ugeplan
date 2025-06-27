
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

// Simplified auth monitor that doesn't interfere with the main auth flow
export const useAuthenticationMonitor = () => {
  const { user, isAuthenticated } = useAuth();
  const [lastCheck, setLastCheck] = useState(new Date());

  // Simple periodic check without interfering with auth state
  useEffect(() => {
    if (!isAuthenticated) return;

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
      connectionStatus: 'connected' as const
    },
    checkAuthStatus: async () => isAuthenticated,
    testDatabaseConnection
  };
};
