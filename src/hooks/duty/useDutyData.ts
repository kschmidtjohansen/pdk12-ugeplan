
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import type { Duty } from '@/types/duty';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isDemoNonHomeDepartment } from '@/constants/demo';

export const useDutyData = (startDate?: Date, endDate?: Date) => {
  const { user, isDemoMode } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const queryClient = useQueryClient();

  const startDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined;
  const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined;

  const queryKey = ['duties', user?.email, startDateStr, endDateStr, selectedDepartmentId] as const;

  const fetchDutiesFn = async (): Promise<Duty[]> => {
    const isDemoMode = user?.email === 'test@polygongroup.com';

    if (isDemoMode) {
      if (isDemoNonHomeDepartment(true, selectedDepartmentId)) {
        if (import.meta.env.DEV) console.log('[useDutyData] Non-home department in demo mode, returning empty');
        return [];
      }

      const { data, error: fetchError } = await supabase.rpc('get_demo_duties_with_employee' as any, {
        start_date_param: startDateStr || null,
        end_date_param: endDateStr || null
      }) as { data: any[] | null; error: any };

      if (fetchError) throw fetchError;

      return (data || []).map((duty: any) => ({
        id: duty.id,
        duty_date: duty.duty_date,
        duty_type: duty.duty_type,
        employee_id: duty.employee_id,
        notes: duty.notes,
        created_by: duty.created_by,
        created_at: duty.created_at,
        updated_at: duty.updated_at,
        employee: duty.employee ? {
          id: duty.employee.id,
          name: duty.employee.name,
          email: duty.employee.email,
          avatar_url: duty.employee.avatar_url
        } : undefined
      })) as Duty[];
    } else {
      const client = getSchemaClient(false);
      let query = client
        .from('on_call_duties')
        .select(`
          *,
          employee:profiles!on_call_duties_employee_id_fkey (
            id, name, email, avatar_url
          )
        `)
        .eq('is_demo', false)
        .order('duty_date', { ascending: true });

      if (selectedDepartmentId && !isDemoMode) {
        query = query.eq('department_id', selectedDepartmentId);
      }
      if (startDateStr) query = query.gte('duty_date', startDateStr);
      if (endDateStr) query = query.lte('duty_date', endDateStr);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      let dutiesWithProfiles = (data || []).map((duty: any) => ({
        ...duty,
        employee: duty.employee || undefined
      }));

      if (!isDemoMode) {
        dutiesWithProfiles = dutiesWithProfiles.filter((duty: any) =>
          duty.employee_id !== '165cdbc9-6722-4c96-97d2-1a87185c8133'
        );
      }

      return dutiesWithProfiles as Duty[];
    }
  };

  const { data: duties = [], isLoading: loading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchDutiesFn,
    enabled: !!user && (isDemoMode || !!selectedDepartmentId),
    staleTime: 5 * 60 * 1000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channelName = `duties_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'on_call_duties' }, (payload) => {
        if (import.meta.env.DEV) console.log('Duty change detected:', payload);
        queryClient.invalidateQueries({ queryKey: ['duties'] });
      })
      .subscribe((status) => {
        if (import.meta.env.DEV) console.log('Duty subscription status:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [user?.email, startDateStr, endDateStr, selectedDepartmentId, queryClient]);

  return {
    duties,
    loading,
    isRefetching: isFetching && !loading,
    error: error || null,
    refetch: () => refetch()
  };
};
