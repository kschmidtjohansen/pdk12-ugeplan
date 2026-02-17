
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

  const checkCleanupNeeded = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin_user');
      
      if (roleError) {
        if (import.meta.env.DEV) console.error('Error checking user role:', roleError);
        return false;
      }
      
      if (!isAdmin) return false;
      
      const { data, error } = await supabase
        .from('system_cleanup_tracking')
        .select('last_run_date')
        .eq('cleanup_type', 'vacation_cleanup')
        .single();
      
      if (error) {
        if (import.meta.env.DEV) console.error('Error checking cleanup tracking:', error);
        return true;
      }
      
      const today = new Date().toISOString().split('T')[0];
      const lastRunDate = data?.last_run_date;
      
      if (import.meta.env.DEV) console.log(`[useVacationCleanup] Cleanup check: today=${today}, lastRun=${lastRunDate}`);
      
      setLastCleanupDate(lastRunDate);
      return lastRunDate !== today;
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error in cleanup check:', err);
      return true;
    }
  }, [user?.id]);

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
        if (import.meta.env.DEV) console.error('Error updating cleanup tracking:', error);
      } else {
        setLastCleanupDate(today);
        if (import.meta.env.DEV) console.log('[useVacationCleanup] Cleanup tracking updated successfully');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error updating cleanup tracking:', err);
    }
  }, []);

  const performCleanupWithRetry = useCallback(async () => {
    if (cleaningUpRef.current || !user?.id) return;
    
    try {
      const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin_user');
      
      if (roleError || !isAdmin) {
        if (import.meta.env.DEV) console.log('[useVacationCleanup] User is not admin, skipping cleanup');
        return;
      }
      
      cleaningUpRef.current = true;
      if (import.meta.env.DEV) console.log(`[useVacationCleanup] Starting cleanup attempt ${retryCountRef.current + 1}/${maxRetries}`);
      
      const { error } = await supabase.rpc('delete_old_rejected_vacations');
      
      if (error) {
        throw new Error(`Cleanup failed: ${error.message}`);
      }
      
      await updateCleanupTracking();
      retryCountRef.current = 0;
      
      if (import.meta.env.DEV) console.log('[useVacationCleanup] Vacation cleanup completed successfully');
      
      toast({
        title: t('vacation.cleanupComplete'),
        description: t('vacation.cleanupCompleteDescription'),
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error(`[useVacationCleanup] Cleanup attempt ${retryCountRef.current + 1} failed:`, err);
      
      retryCountRef.current++;
      
      if (retryCountRef.current < maxRetries) {
        const retryDelay = Math.pow(5, retryCountRef.current) * 1000;
        if (import.meta.env.DEV) console.log(`[useVacationCleanup] Retrying cleanup in ${retryDelay / 1000} seconds...`);
        
        setTimeout(() => {
          performCleanupWithRetry();
        }, retryDelay);
      } else {
        if (import.meta.env.DEV) console.error('[useVacationCleanup] Max retry attempts reached');
        retryCountRef.current = 0;
        
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

  const cleanupRejectedVacations = useCallback(async () => {
    if (import.meta.env.DEV) console.log('[useVacationCleanup] Manual cleanup requested');
    
    const cleanupNeeded = await checkCleanupNeeded();
    if (cleanupNeeded) {
      await performCleanupWithRetry();
    } else {
      if (import.meta.env.DEV) console.log('[useVacationCleanup] Cleanup already performed today, skipping');
    }
  }, [checkCleanupNeeded, performCleanupWithRetry]);

  const cleanupExpiredVacations = useCallback(async () => {
    if (import.meta.env.DEV) console.log('[useVacationCleanup] Expired vacation cleanup handled by main function');
  }, []);

  const scheduleNextCleanup = useCallback(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);
    
    const timeUntilNextCleanup = tomorrow.getTime() - now.getTime();
    
    if (import.meta.env.DEV) console.log(`[useVacationCleanup] Next cleanup in ${Math.floor(timeUntilNextCleanup / 1000 / 60 / 60)}h`);
    
    cleanupTimeoutRef.current = setTimeout(async () => {
      const cleanupNeeded = await checkCleanupNeeded();
      if (cleanupNeeded) {
        await performCleanupWithRetry();
      }
      scheduleNextCleanup();
    }, timeUntilNextCleanup);
  }, [checkCleanupNeeded, performCleanupWithRetry]);

  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    
    const initializeCleanup = async () => {
      if (import.meta.env.DEV) console.log('[useVacationCleanup] Initializing cleanup system...');
      
      const { data: isAdmin, error } = await supabase.rpc('is_admin_user');
      
      if (error) {
        if (import.meta.env.DEV) console.error('[useVacationCleanup] Error checking admin status:', error);
        return;
      }
      
      if (!isAdmin) {
        if (import.meta.env.DEV) console.log('[useVacationCleanup] Non-admin, cleanup disabled');
        return;
      }
      
      if (import.meta.env.DEV) console.log('[useVacationCleanup] Admin detected, enabling cleanup');
      
      const cleanupNeeded = await checkCleanupNeeded();
      if (cleanupNeeded) {
        await performCleanupWithRetry();
      }
      
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
