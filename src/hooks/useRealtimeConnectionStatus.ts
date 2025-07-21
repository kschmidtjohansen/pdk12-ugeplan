
import { useState, useEffect } from 'react';
import { realtimeManager } from '@/services/realtimeManager';

export const useRealtimeConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);

  useEffect(() => {
    const checkStatus = () => {
      const status = realtimeManager.getConnectionStatus();
      const subscriptions = realtimeManager.getActiveSubscriptions();
      
      setConnectionStatus(status);
      setActiveSubscriptions(subscriptions.length);
    };

    // Check status immediately
    checkStatus();

    // Check status periodically
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    return await realtimeManager.checkConnection();
  };

  return {
    connectionStatus,
    activeSubscriptions,
    isConnected: connectionStatus === 'connected',
    checkConnection
  };
};
