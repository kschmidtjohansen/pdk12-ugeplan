import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Hook for demo tracking — cleanup now uses reset_demo_data RPC (no sessionStorage)
export const useDemoTracking = () => {
  const { isDemoMode } = useAuth();

  // Auto cleanup check on mount via RPC
  useEffect(() => {
    if (!isDemoMode) return;
    
    // Fire cleanup_demo_data_ttl to remove stale demo data older than 15 min
    const runTTLCleanup = async () => {
      try {
        if (import.meta.env.DEV) console.log('[Demo] Running TTL cleanup via RPC');
        await supabase.rpc('cleanup_demo_data_ttl' as any);
      } catch (err) {
        if (import.meta.env.DEV) console.error('[Demo] TTL cleanup failed:', err);
      }
    };
    
    runTTLCleanup();
  }, [isDemoMode]);

  const triggerManualCleanup = async () => {
    try {
      if (import.meta.env.DEV) console.log('[Demo] Manual cleanup via reset_demo_data RPC');
      const { error } = await supabase.rpc('reset_demo_data' as any);
      if (error) throw error;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Demo] Manual cleanup failed:', err);
    }
  };

  return {
    triggerManualCleanup,
    isDemoMode
  };
};
