
import React, { useEffect } from 'react';
import { useVacationCleanup } from '@/hooks/vacation/useVacationCleanup';
import { useAuth } from '@/context/AuthContext';

/**
 * Background component that handles automated cleanup of both rejected vacation requests
 * after 14 days and expired approved vacations. This component doesn't render anything visible.
 * 
 * Now optimized with:
 * - System-wide cleanup coordination to prevent multiple runs
 * - Better error handling with exponential backoff retry logic
 * - Performance optimizations with database indexes
 * - Scheduled cleanup at 2 AM to reduce system load
 */
const VacationCleanupHandler: React.FC = () => {
  const { lastCleanupDate, cleanupRejectedVacations } = useVacationCleanup();
  const { user } = useAuth();
  
  useEffect(() => {
    // Log when the component is mounted
    console.log('[VacationCleanupHandler] Component mounted', { 
      lastCleanupDate,
      userRole: user?.role,
      isAdmin: user?.role === 'administrator'
    });
    
    // Only administrators should be able to trigger the cleanup
    if (user?.role === 'administrator') {
      console.log('[VacationCleanupHandler] Administrator logged in, vacation cleanup system enabled');
      
      // The cleanup system is now automatically handled by the hook
      // No need to manually trigger cleanup here as it's handled by the scheduling system
    } else {
      console.log('[VacationCleanupHandler] Non-admin user, cleanup system disabled');
    }
  }, [lastCleanupDate, user?.role]);

  // This component doesn't render anything visible
  return null;
};

export default VacationCleanupHandler;
