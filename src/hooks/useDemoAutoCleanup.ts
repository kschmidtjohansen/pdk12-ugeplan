import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE_CLEANUP_MS = 60 * 1000; // 1 minute warning

export const useDemoAutoCleanup = () => {
  const { isDemoMode } = useAuth();
  const { toast } = useToast();
  const [timeUntilCleanup, setTimeUntilCleanup] = useState<number>(CLEANUP_INTERVAL_MS);
  const [showWarning, setShowWarning] = useState(false);

  const performCleanup = useCallback(async () => {
    if (import.meta.env.DEV) console.log('[Demo Auto-Cleanup] Calling reset_demo_data RPC...');
    try {
      const { data: result, error } = await supabase.rpc('reset_demo_data' as any);
      if (error) throw error;
      
      toast({
        title: "Demo Session Nulstillet",
        description: "Demo-data ryddet fra databasen.",
      });
      
      // Reset the timer
      setTimeUntilCleanup(CLEANUP_INTERVAL_MS);
      setShowWarning(false);
      
      // Reload to show baseline data
      window.location.reload();
      
      if (import.meta.env.DEV) console.log('[Demo Auto-Cleanup] Cleanup completed:', result);
    } catch (error) {
      console.error('[Demo Auto-Cleanup] Cleanup failed:', error);
      toast({
        title: "Nulstilling Mislykkedes",
        description: "Kunne ikke nulstille demo data.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const showCleanupWarning = useCallback(() => {
    setShowWarning(true);
    toast({
      title: "Demo Data Vil Blive Ryddet",
      description: "Demo data ryddes automatisk om 1 minut. Alle ændringer mistes.",
      variant: "default",
    });
  }, [toast]);

  const extendDemoSession = useCallback(() => {
    setTimeUntilCleanup(CLEANUP_INTERVAL_MS);
    setShowWarning(false);
    
    toast({
      title: "Demo Session Forlænget",
      description: "Demo session forlænget med 15 minutter.",
    });
  }, [toast]);

  // Main cleanup timer effect
  useEffect(() => {
    if (!isDemoMode) {
      setTimeUntilCleanup(CLEANUP_INTERVAL_MS);
      setShowWarning(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeUntilCleanup(prev => {
        const newTime = prev - 1000; // Decrease by 1 second
        
        // Show warning when 1 minute remains
        if (newTime === WARNING_BEFORE_CLEANUP_MS && !showWarning) {
          showCleanupWarning();
        }
        
        // Perform cleanup when time reaches 0
        if (newTime <= 0) {
          performCleanup();
          return CLEANUP_INTERVAL_MS; // Reset timer
        }
        
        return newTime;
      });
    }, 1000); // Update every second for accurate countdown

    return () => clearInterval(interval);
  }, [isDemoMode, showWarning, performCleanup, showCleanupWarning]);

  // Session-end cleanup via RPC (fire-and-forget)
  useEffect(() => {
    if (!isDemoMode) return;

    const handleBeforeUnload = () => {
      // Fire-and-forget cleanup attempt on page close
      try {
        supabase.rpc('reset_demo_data' as any);
      } catch { /* ignore */ }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDemoMode]);

  const formatTimeRemaining = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    timeUntilCleanup,
    timeRemainingFormatted: formatTimeRemaining(timeUntilCleanup),
    showWarning,
    extendDemoSession,
    performManualCleanup: performCleanup,
    isDemoMode
  };
};