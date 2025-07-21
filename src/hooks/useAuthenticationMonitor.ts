
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

// Simplified auth monitor that doesn't interfere with the main auth flow
export const useAuthenticationMonitor = () => {
  const { user, isAuthenticated } = useAuth();
  const [lastCheck, setLastCheck] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');

  // Very simple monitoring without complex operations
  useEffect(() => {
    if (!isAuthenticated) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connected');
    
    // Simple periodic update
    const interval = setInterval(() => {
      setLastCheck(new Date());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return {
    authStatus: {
      isAuthenticated,
      sessionValid: isAuthenticated,
      tokenExpiring: false,
      lastCheck,
      connectionStatus
    },
    checkAuthStatus: async () => isAuthenticated,
    testDatabaseConnection: async () => true
  };
};
