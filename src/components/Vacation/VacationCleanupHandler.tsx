
import React, { useEffect } from 'react';
import { useVacationCleanup } from '@/hooks/vacation/useVacationCleanup';
import { useAuth } from '@/context/AuthContext';

/**
 * Background component that handles automated cleanup of both rejected vacation requests
 * after 14 days and expired approved vacations. This component doesn't render anything visible.
 */
const VacationCleanupHandler: React.FC = () => {
  const { lastCleanupDate, cleanupRejectedVacations, cleanupExpiredVacations } = useVacationCleanup();
  const { user } = useAuth();
  
  useEffect(() => {
    // Log when the component is mounted
    console.log('VacationCleanupHandler mounted', { lastCleanupDate });
    
    // Only administrators should be able to trigger the cleanup
    if (user?.role === 'administrator') {
      console.log('Administrator logged in, vacation cleanup enabled');
      
      // Run an initial cleanup check on mount if needed
      const today = new Date().toISOString().split('T')[0];
      if (lastCleanupDate !== today) {
        console.log('Running cleanup on component mount');
        // Run both cleanup functions
        cleanupRejectedVacations();
        cleanupExpiredVacations();
      }
    }
  }, [lastCleanupDate, user?.role, cleanupRejectedVacations, cleanupExpiredVacations]);

  // This component doesn't render anything visible
  return null;
};

export default VacationCleanupHandler;
