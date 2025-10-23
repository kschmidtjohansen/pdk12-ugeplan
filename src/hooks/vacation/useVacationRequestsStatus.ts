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
        console.log('[useVacationRequestsStatus] 🔍 FETCHING PENDING REQUESTS', {
          isDemoMode,
          isEffectiveAdmin,
          userDataLoaded,
          timestamp: new Date().toISOString()
        });

        if (isDemoMode) {
          // Use demo RPC for secure data access
          const { data, error } = await supabase.rpc('get_demo_vacations');
          
          console.log('[useVacationRequestsStatus] 🔍 DEMO RPC RESULT', {
            success: !error,
            dataCount: data?.length || 0,
            error: error?.message
          });
          
          if (error) throw error;
          
          const pendingData = (data || []).filter((v: any) => v.status === 'pending');
          const count = pendingData.length;
          
          console.log('[useVacationRequestsStatus] ✅ DEMO PENDING COUNT', {
            total_vacations: data?.length || 0,
            pending_count: count,
            pending_ids: pendingData.map((v: any) => v.id)
          });
          
          setPendingCount(count);
          setHasPendingRequests(count > 0);
        } else {
          // Production mode: query public schema
          const { data, error } = await supabase
            .from('vacations')
            .select('id', { count: 'exact', head: false })
            .eq('status', 'pending');

          console.log('[useVacationRequestsStatus] 🔍 PRODUCTION QUERY RESULT', {
            success: !error,
            dataCount: data?.length || 0,
            error: error?.message
          });

          if (error) throw error;

          const count = data?.length || 0;
          
          console.log('[useVacationRequestsStatus] ✅ PRODUCTION PENDING COUNT', {
            pending_count: count,
            pending_ids: data?.map(v => v.id)
          });
          
          setPendingCount(count);
          setHasPendingRequests(count > 0);
          
          console.log('[useVacationRequestsStatus] 🎯 FINAL STATE', {
            hasPendingRequests: count > 0,
            pendingCount: count
          });
        }
      } catch (error) {
        console.error('[useVacationRequestsStatus] ❌ ERROR fetching pending vacation requests:', error);
        setHasPendingRequests(false);
        setPendingCount(0);
      }
    };

    fetchPendingRequests();

    // Set up real-time subscription for vacation status changes
    const schemaName = isDemoMode ? 'demo' : 'public';
    const channel = supabase
      .channel(`vacation-requests-status-${schemaName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: schemaName,
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
