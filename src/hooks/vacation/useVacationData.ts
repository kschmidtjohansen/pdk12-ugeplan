
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
      
      console.log('Fetching vacations...');
      
      // Get all vacations with employee names through an explicit join query
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
          updated_at
        `);
      
      if (error) throw error;
      
      if (data) {
        console.log(`Fetched ${data.length} vacations`);
        
        // Get all user profiles in a separate query
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name');
          
        if (profilesError) throw profilesError;
        
        // Create a map of user IDs to names
        const profileMap = new Map();
        profiles?.forEach(profile => {
          profileMap.set(profile.id, profile.name);
        });
        
        const formattedVacations: Vacation[] = data.map(item => ({
          id: item.id,
          employeeId: item.user_id,
          employeeName: profileMap.get(item.user_id) || 'Unknown',
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
    console.log('Setting up vacation realtime subscription...');
    
    const channel = supabase
      .channel('vacation_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'vacations'
        },
        (payload) => {
          console.log('Received vacation change event:', payload.eventType, payload);
          
          // Use different strategies based on the event type
          if (payload.eventType === 'DELETE') {
            console.log('Vacation deleted:', payload.old.id);
            // Remove the deleted vacation from the local state
            setVacations(current => 
              current.filter(v => v.id !== payload.old.id)
            );
          } else {
            // For INSERT and UPDATE, refresh the entire list
            // This ensures we get the correct employee names
            fetchVacations();
          }
        }
      )
      .subscribe((status) => {
        console.log('Vacation realtime subscription status:', status);
      });
      
    return () => {
      console.log('Cleaning up vacation realtime subscription');
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
