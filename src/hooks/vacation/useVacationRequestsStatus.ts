import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useVacationRequestsStatus = () => {
  const { isEffectiveAdmin, userDataLoaded, isDemoMode } = useAuth();
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Only fetch for admins and wait for user data to be loaded
    if (!isEffectiveAdmin || !userDataLoaded) {
      setHasPendingRequests(false);
      setPendingCount(0);
      return;
    }

    const fetchPendingRequests = async () => {
      try {
        if (isDemoMode) {
          const { data, error } = await supabase.rpc('get_demo_vacations');
          if (error) throw error;
          const count = (data || []).filter((v: any) => v.status === 'pending').length;
          setPendingCount(count);
          setHasPendingRequests(count > 0);
        } else {
          const { data, error } = await supabase
            .from('vacations')
            .select('id', { count: 'exact', head: false })
            .eq('status', 'pending');
          if (error) throw error;
          const count = data?.length || 0;
          setPendingCount(count);
          setHasPendingRequests(count > 0);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('[useVacationRequestsStatus] Error fetching pending vacation requests:', error);
        setHasPendingRequests(false);
        setPendingCount(0);
      }
    };

    fetchPendingRequests();

    // Set up real-time subscription for vacation status changes
    const channel = supabase
      .channel('vacation-requests-status-public')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vacations',
          filter: 'status=eq.pending'
        },
        () => {
          fetchPendingRequests();
        }
      )
      .subscribe();

    // Add polling fallback every 30 seconds to ensure updates aren't missed
    const pollInterval = setInterval(() => {
      fetchPendingRequests();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [isEffectiveAdmin, userDataLoaded, isDemoMode]);

  return { hasPendingRequests, pendingCount };
};
