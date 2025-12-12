import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { useAuth } from '@/context/AuthContext';
import type { Duty } from '@/types/duty';

export const useDutyData = (startDate?: Date, endDate?: Date) => {
  const { user } = useAuth();
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Convert dates to stable strings to prevent excessive re-renders
  const startDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined;
  const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined;

  const fetchDuties = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setIsRefetching(true);
      }
      setError(null);

      const isDemoMode = user?.email === 'test@polygongroup.com';

      if (isDemoMode) {
        // Use RPC function for demo mode to get duties with employee data
        const { data, error: fetchError } = await supabase.rpc('get_demo_duties_with_employee' as any, {
          start_date_param: startDateStr || null,
          end_date_param: endDateStr || null
        }) as { data: any[] | null; error: any };

        if (fetchError) throw fetchError;

        // Map RPC result to Duty format
        const dutiesWithProfiles = (data || []).map((duty: any) => ({
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
        }));

        setDuties(dutiesWithProfiles as Duty[]);
      } else {
        // Regular mode - use direct schema query
        const client = getSchemaClient(false);

        let query = client
          .from('on_call_duties')
          .select(`
            *,
            employee:profiles!on_call_duties_employee_id_fkey (
              id,
              name,
              email,
              avatar_url
            )
          `)
          .order('duty_date', { ascending: true });

        if (startDateStr) {
          query = query.gte('duty_date', startDateStr);
        }

        if (endDateStr) {
          query = query.lte('duty_date', endDateStr);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Map the data with basic employee info (roles will be enriched in DutyPage)
        const dutiesWithProfiles = (data || []).map((duty: any) => ({
          ...duty,
          employee: duty.employee || undefined
        }));

        // Filter out demo user's duties from production view
        const DEMO_USER_ID = '165cdbc9-6722-4c96-97d2-1a87185c8133';
        const filteredDuties = dutiesWithProfiles.filter((duty: any) => 
          duty.employee_id !== DEMO_USER_ID
        );

        setDuties(filteredDuties as Duty[]);
      }
    } catch (err) {
      console.error('Error fetching duties:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch duties'));
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  };

  useEffect(() => {
    fetchDuties(true);

    const isDemoMode = user?.email === 'test@polygongroup.com';
    const schema = isDemoMode ? 'demo' : 'public';
    
    // Use unique channel name to prevent conflicts
    const channelName = `duties_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: schema,
          table: 'on_call_duties'
        },
        (payload) => {
          console.log('Duty change detected:', payload);
          fetchDuties(false);
        }
      )
      .subscribe((status) => {
        console.log('Duty subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, startDateStr, endDateStr]);

  return {
    duties,
    loading,
    isRefetching,
    error,
    refetch: () => fetchDuties(false)
  };
};
