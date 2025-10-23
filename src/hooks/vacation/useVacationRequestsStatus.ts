import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useVacationRequestsStatus = () => {
  const { isEffectiveAdmin } = useAuth();
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Only fetch for admins
    if (!isEffectiveAdmin) {
      setHasPendingRequests(false);
      setPendingCount(0);
      return;
    }

    const fetchPendingRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('vacations')
          .select('id', { count: 'exact', head: false })
          .eq('status', 'pending');

        if (error) throw error;

        const count = data?.length || 0;
        setPendingCount(count);
        setHasPendingRequests(count > 0);
      } catch (error) {
        console.error('Error fetching pending vacation requests:', error);
        setHasPendingRequests(false);
        setPendingCount(0);
      }
    };

    fetchPendingRequests();

    // Set up real-time subscription for vacation status changes
    const channel = supabase
      .channel('vacation-requests-status')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isEffectiveAdmin]);

  return { hasPendingRequests, pendingCount };
};
