import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DemoUserService } from '@/services/demoUserService';
import { useToast } from '@/hooks/use-toast';

const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE_CLEANUP_MS = 60 * 1000; // 1 minute warning

export const useDemoAutoCleanup = () => {
  const { isDemoMode } = useAuth();
  const { toast } = useToast();
  const [timeUntilCleanup, setTimeUntilCleanup] = useState<number>(CLEANUP_INTERVAL_MS);
  const [showWarning, setShowWarning] = useState(false);
  
  const demoService = DemoUserService.getInstance();

  const performCleanup = useCallback(async () => {
    console.log('[Demo Auto-Cleanup] Performing scheduled cleanup...');
    try {
      const result = await demoService.cleanupAllDemoUserData();
      const totalDeleted = Object.values(result.deletedCounts).reduce((sum, count) => sum + count, 0);
      
      toast({
        title: "Demo Data Automatisk Ryddet",
        description: `Ryddede ${totalDeleted} poster. Demo session opdateret.`,
      });
      
      // Reset the timer
      setTimeUntilCleanup(CLEANUP_INTERVAL_MS);
      setShowWarning(false);
      
      console.log('[Demo Auto-Cleanup] Cleanup completed:', result);
    } catch (error) {
      console.error('[Demo Auto-Cleanup] Cleanup failed:', error);
      toast({
        title: "Auto-Oprydning Mislykkedes",
        description: "Kunne ikke rydde demo data. Prøv manuel oprydning.",
        variant: "destructive",
      });
    }
  }, [demoService, toast]);

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
    demoService.updateActivity();
    
    toast({
      title: "Demo Session Forlænget",
      description: "Demo session forlænget med 15 minutter.",
    });
  }, [demoService, toast]);

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

  // Session-end cleanup effects
  useEffect(() => {
    if (!isDemoMode) return;

    const handleBeforeUnload = async () => {
      await demoService.cleanupAllDemoUserData();
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        await demoService.cleanupAllDemoUserData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDemoMode, demoService]);

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