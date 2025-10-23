
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useVacationCleanup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [lastCleanupDate, setLastCleanupDate] = useState<string | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleaningUpRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Check if cleanup is needed today (system-wide check using optimized function)
  const checkCleanupNeeded = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      // Use the new optimized function instead of checking role manually
      const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin_user');
      
      if (roleError) {
        console.error('Error checking user role:', roleError);
        return false;
      }
      
      if (!isAdmin) return false;
      
      const { data, error } = await supabase
        .from('system_cleanup_tracking')
        .select('last_run_date')
        .eq('cleanup_type', 'vacation_cleanup')
        .single();
      
      if (error) {
        console.error('Error checking cleanup tracking:', error);
        return true; // If we can't check, assume cleanup is needed
      }
      
      const today = new Date().toISOString().split('T')[0];
      const lastRunDate = data?.last_run_date;
      
      console.log(`[useVacationCleanup] Cleanup check: today=${today}, lastRun=${lastRunDate}`);
      
      setLastCleanupDate(lastRunDate);
      return lastRunDate !== today;
    } catch (err) {
      console.error('Error in cleanup check:', err);
      return true; // If we can't check, assume cleanup is needed
    }
  }, [user?.id]);

  // Update cleanup tracking with better error handling
  const updateCleanupTracking = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('system_cleanup_tracking')
        .upsert({ 
          cleanup_type: 'vacation_cleanup',
          last_run_date: today 
        }, { 
          onConflict: 'cleanup_type' 
        });
      
      if (error) {
        console.error('Error updating cleanup tracking:', error);
      } else {
        setLastCleanupDate(today);
        console.log('[useVacationCleanup] Cleanup tracking updated successfully');
      }
    } catch (err) {
      console.error('Error updating cleanup tracking:', err);
    }
  }, []);

  // Function to perform the cleanup with retry logic and optimized permissions
  const performCleanupWithRetry = useCallback(async () => {
    if (cleaningUpRef.current || !user?.id) return;
    
    try {
      // Double-check admin status using the optimized function
      const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin_user');
      
      if (roleError || !isAdmin) {
        console.log('[useVacationCleanup] User is not admin, skipping cleanup');
        return;
      }
      
      cleaningUpRef.current = true;
      console.log(`[useVacationCleanup] Starting cleanup attempt ${retryCountRef.current + 1}/${maxRetries}`);
      
      // Call the database function to clean up rejected and expired vacations
      const { error } = await supabase.rpc('delete_old_rejected_vacations');
      
      if (error) {
        throw new Error(`Cleanup failed: ${error.message}`);
      }
      
      // Update tracking to prevent multiple runs
      await updateCleanupTracking();
      
      // Reset retry count on success
      retryCountRef.current = 0;
      
      console.log('[useVacationCleanup] Vacation cleanup completed successfully');
      
      // Show success toast for admins
      toast({
        title: t('vacation.cleanupComplete'),
        description: t('vacation.cleanupCompleteDescription'),
      });
    } catch (err) {
      console.error(`[useVacationCleanup] Cleanup attempt ${retryCountRef.current + 1} failed:`, err);
      
      retryCountRef.current++;
      
      if (retryCountRef.current < maxRetries) {
        // Exponential backoff: 5s, 25s, 125s
        const retryDelay = Math.pow(5, retryCountRef.current) * 1000;
        console.log(`[useVacationCleanup] Retrying cleanup in ${retryDelay / 1000} seconds...`);
        
        setTimeout(() => {
          performCleanupWithRetry();
        }, retryDelay);
      } else {
        console.error('[useVacationCleanup] Max retry attempts reached, cleanup failed permanently');
        retryCountRef.current = 0; // Reset for next day
        
        // Show error toast for critical failure
        toast({
          title: 'Cleanup Failed',
          description: 'Vacation cleanup failed after multiple attempts. Please contact support.',
          variant: 'destructive',
        });
      }
    } finally {
      cleaningUpRef.current = false;
    }
  }, [user?.id, toast, t, updateCleanupTracking]);

  // Function to perform the cleanup of rejected vacations
  const cleanupRejectedVacations = useCallback(async () => {
    console.log('[useVacationCleanup] Manual cleanup requested - checking if needed...');
    
    const cleanupNeeded = await checkCleanupNeeded();
    if (cleanupNeeded) {
      await performCleanupWithRetry();
    } else {
      console.log('[useVacationCleanup] Cleanup already performed today, skipping');
    }
  }, [checkCleanupNeeded, performCleanupWithRetry]);

  // Function to clean up expired approved vacations (now included in main cleanup)
  const cleanupExpiredVacations = useCallback(async () => {
    // This is now handled by the combined cleanup function
    console.log('[useVacationCleanup] Expired vacation cleanup is now handled by main cleanup function');
  }, []);

  // Function to schedule the next cleanup with better timing
  const scheduleNextCleanup = useCallback(() => {
    // Clear any existing timeout
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    
    // Schedule cleanup for 2 AM the next day (when traffic is typically low)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2:00 AM
    
    const timeUntilNextCleanup = tomorrow.getTime() - now.getTime();
    
    console.log(`[useVacationCleanup] Scheduling next cleanup in ${Math.floor(timeUntilNextCleanup / 1000 / 60 / 60)} hours and ${Math.floor((timeUntilNextCleanup / 1000 / 60) % 60)} minutes (at 2 AM)`);
    
    cleanupTimeoutRef.current = setTimeout(async () => {
      const cleanupNeeded = await checkCleanupNeeded();
      if (cleanupNeeded) {
        await performCleanupWithRetry();
      }
      
      // Schedule the next cleanup
      scheduleNextCleanup();
    }, timeUntilNextCleanup);
  }, [checkCleanupNeeded, performCleanupWithRetry]);

  // Clean up the timeout on component unmount
  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, []);

  // Initialize cleanup system with optimized role checking
  useEffect(() => {
    if (!user?.id) return;
    
    const initializeCleanup = async () => {
      console.log('[useVacationCleanup] Initializing cleanup system...');
      
      // Use optimized function to check if user is admin
      const { data: isAdmin, error } = await supabase.rpc('is_admin_user');
      
      if (error) {
        console.error('[useVacationCleanup] Error checking admin status:', error);
        return;
      }
      
      if (!isAdmin) {
        console.log('[useVacationCleanup] User is not admin, cleanup system disabled');
        return;
      }
      
      console.log('[useVacationCleanup] Admin user detected, enabling cleanup system');
      
      // Check if cleanup is needed and run if so
      const cleanupNeeded = await checkCleanupNeeded();
      if (cleanupNeeded) {
        console.log('[useVacationCleanup] Running initial cleanup check');
        await performCleanupWithRetry();
      }
      
      // Schedule future cleanups
      scheduleNextCleanup();
    };
    
    initializeCleanup();
  }, [user?.id, checkCleanupNeeded, performCleanupWithRetry, scheduleNextCleanup]);
  
  return {
    lastCleanupDate,
    cleanupRejectedVacations,
    cleanupExpiredVacations
  };
};
