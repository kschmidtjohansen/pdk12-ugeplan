import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subscribeToTable } from '@/lib/realtimeChannels';
import { useAuth } from '@/context/AuthContext';
import type { Duty } from '@/types/duty';

export interface DutySwapRequestRow {
  id: string;
  duty_id: string;
  requested_by: string;
  candidate_ids: string[];
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  accepted_by: string | null;
  accepted_at: string | null;
  department_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface DutySwapRequestWithDuty extends DutySwapRequestRow {
  duty?: Duty | null;
  requester?: { id: string; name: string; avatar_url: string | null } | null;
}

const fetchSwapRequests = async (userId: string): Promise<DutySwapRequestWithDuty[]> => {
  // Pending requests where the user is requester or a candidate
  const { data, error } = await supabase
    .from('duty_swap_requests')
    .select('*')
    .eq('status', 'pending')
    .or(`requested_by.eq.${userId},candidate_ids.cs.{${userId}}`);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const dutyIds = Array.from(new Set(data.map((r: any) => r.duty_id)));
  const requesterIds = Array.from(new Set(data.map((r: any) => r.requested_by)));

  const [dutiesRes, profilesRes] = await Promise.all([
    supabase.from('on_call_duties').select('*').in('id', dutyIds),
    supabase.from('profiles').select('id, name, avatar_url').in('id', requesterIds),
  ]);

  const dutyMap = new Map((dutiesRes.data || []).map((d: any) => [d.id, d]));
  const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));

  return (data as any[]).map((r) => ({
    ...r,
    duty: dutyMap.get(r.duty_id) as Duty | undefined,
    requester: profileMap.get(r.requested_by) as any,
  }));
};

export const useDutySwapRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['duty_swap_requests', user?.id],
    queryFn: () => fetchSwapRequests(user!.id),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('duty-swap-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duty_swap_requests' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['duty_swap_requests'] });
          queryClient.invalidateQueries({ queryKey: ['duties'] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const incoming = (query.data ?? []).filter(
    (r) => r.requested_by !== user?.id && r.candidate_ids.includes(user?.id ?? ''),
  );
  const outgoing = (query.data ?? []).filter((r) => r.requested_by === user?.id);

  return {
    requests: query.data ?? [],
    incoming,
    outgoing,
    loading: query.isLoading,
    refetch: query.refetch,
  };
};
