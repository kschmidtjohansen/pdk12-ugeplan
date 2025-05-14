
import { useState, useEffect, useCallback, useRef } from 'react';
import { differenceInDays } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Vacation } from '@/types/vacation';

export const useVacationCleanup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [lastCleanupDate, setLastCleanupDate] = useState<string | null>(
    localStorage.getItem('lastVacationCleanupDate')
  );
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleaningUpRef = useRef(false);

  // Function to perform the cleanup
  const cleanupRejectedVacations = useCallback(async () => {
    if (cleaningUpRef.current || !user?.id) return;
    
    try {
      cleaningUpRef.current = true;
      console.log('Checking for rejected vacation requests to clean up...');
      
      // Call the database function to clean up rejected vacations
      const { data, error } = await supabase.rpc('delete_old_rejected_vacations');
      
      if (error) {
        console.error('Error cleaning up rejected vacations:', error);
        return;
      }
      
      // Update the last cleanup date
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('lastVacationCleanupDate', today);
      setLastCleanupDate(today);
      
      console.log('Vacation cleanup completed successfully');
    } catch (err) {
      console.error('Error in vacation cleanup process:', err);
    } finally {
      cleaningUpRef.current = false;
    }
  }, [user?.id]);

  // Function to schedule the next cleanup
  const scheduleNextCleanup = useCallback(() => {
    // Clear any existing timeout
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    
    // Schedule the next cleanup for tomorrow at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 5, 0); // 00:00:05, just after midnight
    
    const timeUntilNextCleanup = tomorrow.getTime() - now.getTime();
    
    console.log(`Scheduling next vacation cleanup in ${Math.floor(timeUntilNextCleanup / 1000 / 60 / 60)} hours and ${Math.floor((timeUntilNextCleanup / 1000 / 60) % 60)} minutes`);
    
    cleanupTimeoutRef.current = setTimeout(() => {
      cleanupRejectedVacations();
      // Schedule the next cleanup after this one completes
      scheduleNextCleanup();
    }, timeUntilNextCleanup);
  }, [cleanupRejectedVacations]);

  // Clean up the timeout on component unmount
  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, []);

  // Check if cleanup should run (if it hasn't been run today)
  useEffect(() => {
    if (!user?.id) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // If we haven't cleaned up today, do it now
    if (lastCleanupDate !== today && user.role === 'administrator') {
      console.log('Running initial vacation cleanup check');
      cleanupRejectedVacations();
    }
    
    // Schedule the next cleanup
    scheduleNextCleanup();
  }, [user, lastCleanupDate, cleanupRejectedVacations, scheduleNextCleanup]);
  
  return {
    lastCleanupDate,
    cleanupRejectedVacations
  };
};
