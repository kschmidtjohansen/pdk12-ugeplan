
import { useState, useEffect } from 'react';
import { Vacation, VacationStatus } from '@/types/vacation';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { safeProperty } from '@/utils/dbHelpers';

export const useVacationData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vacations from Supabase
  const fetchVacations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all vacations with employee names
      const { data, error } = await supabase
        .from('vacations')
        .select(`
          id,
          user_id,
          start_date,
          end_date,
          reason,
          status,
          notes,
          created_at,
          updated_at,
          profiles:user_id (name)
        `)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedVacations: Vacation[] = data.map(item => ({
          id: item.id,
          employeeId: item.user_id,
          employeeName: safeProperty(item.profiles, 'name', 'Unknown'),
          startDate: new Date(item.start_date),
          endDate: new Date(item.end_date),
          reason: item.reason || '',
          status: item.status as VacationStatus,
          notes: item.notes || '',
          createdAt: new Date(item.created_at)
        }));
        
        setVacations(formattedVacations);
      }
    } catch (err) {
      console.error('Error fetching vacations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vacations');
      toast({
        title: t('common.error'),
        description: t('vacation.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load vacations on component mount
  useEffect(() => {
    fetchVacations();
  }, []);
  
  // Subscribe to vacation changes
  useEffect(() => {
    const channel = supabase
      .channel('vacation_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vacations'
        },
        () => {
          fetchVacations(); // Refresh when changes occur
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    vacations,
    loading,
    error,
    fetchVacations
  };
};
