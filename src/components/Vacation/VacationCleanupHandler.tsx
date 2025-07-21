
import React, { useEffect } from 'react';
import { useVacationCleanup } from '@/hooks/vacation/useVacationCleanup';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Background component that handles automated cleanup of both rejected vacation requests
 * after 14 days and expired approved vacations. This component doesn't render anything visible.
 * 
 * Now optimized with:
 * - System-wide cleanup coordination to prevent multiple runs
 * - Better error handling with exponential backoff retry logic
 * - Performance optimizations with database indexes and optimized RLS functions
 * - Scheduled cleanup at 2 AM to reduce system load
 * - Uses new optimized security definer functions for better performance
 */
const VacationCleanupHandler: React.FC = () => {
  const { lastCleanupDate } = useVacationCleanup();
  const { user } = useAuth();
  
  useEffect(() => {
    // Log when the component is mounted
    console.log('[VacationCleanupHandler] Component mounted', { 
      lastCleanupDate,
      userId: user?.id
    });
    
    // Check if user is admin using the optimized function
    const checkAdminStatus = async () => {
      if (!user?.id) {
        console.log('[VacationCleanupHandler] No user logged in');
        return;
      }

      try {
        const { data: isAdmin, error } = await supabase.rpc('is_admin_user');
        
        if (error) {
          console.error('[VacationCleanupHandler] Error checking admin status:', error);
          return;
        }
        
        if (isAdmin) {
          console.log('[VacationCleanupHandler] Administrator logged in, vacation cleanup system enabled');
          // The cleanup system is now automatically handled by the hook
          // No need to manually trigger cleanup here as it's handled by the scheduling system
        } else {
          console.log('[VacationCleanupHandler] Non-admin user, cleanup system disabled');
        }
      } catch (err) {
        console.error('[VacationCleanupHandler] Error in admin status check:', err);
      }
    };
    
    checkAdminStatus();
  }, [lastCleanupDate, user?.id]);

  // This component doesn't render anything visible
  return null;
};

export default VacationCleanupHandler;
