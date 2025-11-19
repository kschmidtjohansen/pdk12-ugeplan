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

  const fetchDuties = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setIsRefetching(true);
      }
      setError(null);

      const isDemoMode = user?.email === 'test@polygongroup.com';
      const client = getSchemaClient(isDemoMode);

      let query = client
        .from('on_call_duties')
        .select(`
          *,
          employee:profiles!employee_id (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .order('duty_date', { ascending: true });

      if (startDate) {
        query = query.gte('duty_date', startDate.toISOString().split('T')[0]);
      }

      if (endDate) {
        query = query.lte('duty_date', endDate.toISOString().split('T')[0]);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setDuties(data as Duty[] || []);
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
    
    const channel = supabase
      .channel('on_call_duties_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: schema,
          table: 'on_call_duties'
        },
        () => {
          fetchDuties(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, startDate, endDate]);

  return {
    duties,
    loading,
    isRefetching,
    error,
    refetch: () => fetchDuties(false)
  };
};
