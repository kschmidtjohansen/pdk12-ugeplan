
import React, { useEffect } from 'react';
import { useVacationCleanup } from '@/hooks/vacation/useVacationCleanup';
import { useAuth } from '@/context/AuthContext';

/**
 * Background component that handles automated cleanup of rejected vacation requests
 * after 14 days. This component doesn't render anything visible.
 */
const VacationCleanupHandler: React.FC = () => {
  const { lastCleanupDate, cleanupRejectedVacations } = useVacationCleanup();
  const { user } = useAuth();
  
  useEffect(() => {
    // Log when the component is mounted
    console.log('VacationCleanupHandler mounted', { lastCleanupDate });
    
    // Only administrators should be able to trigger the cleanup
    if (user?.role === 'administrator') {
      console.log('Administrator logged in, vacation cleanup enabled');
    }
  }, [lastCleanupDate, user?.role]);

  // This component doesn't render anything visible
  return null;
};

export default VacationCleanupHandler;
