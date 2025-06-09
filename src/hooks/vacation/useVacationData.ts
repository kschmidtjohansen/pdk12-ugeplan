
import { useState, useEffect } from 'react';
import { Vacation, VacationStatus } from '@/types/vacation';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';

export const useVacationData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vacations from Supabase with optimized query
  const fetchVacations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useVacationData] Fetching vacations with optimized RLS...');
      
      // Use optimized query that benefits from the new indexes and RLS functions
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
        `)
        .order('created_at', { ascending: false }); // Use indexed sort
      
      if (error) throw error;
      
      if (data) {
        console.log(`[useVacationData] Fetched ${data.length} vacations`);
        
        // Get all unique user IDs from vacations for efficient profile lookup
        const userIds = [...new Set(data.map(item => item.user_id))];
        
        if (userIds.length > 0) {
          // Use optimized query with the new email index
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds); // More efficient than separate queries
            
          if (profilesError) throw profilesError;
          
          // Create a map of user IDs to names for efficient lookup
          const profileMap = new Map();
          profiles?.forEach(profile => {
            profileMap.set(profile.id, profile.name);
          });
          
          const formattedVacations: Vacation[] = data.map(item => {
            // Ensure dates are properly parsed as Date objects
            const startDate = new Date(item.start_date);
            const endDate = new Date(item.end_date);
            
            const vacation: Vacation = {
              id: item.id,
              employeeId: item.user_id, // CONSISTENT: Map user_id to employeeId
              employeeName: profileMap.get(item.user_id) || 'Unknown',
              startDate: startDate,
              endDate: endDate,
              reason: item.reason || '',
              status: item.status as VacationStatus,
              notes: item.notes || '',
              createdAt: new Date(item.created_at)
            };
            
            console.log('[useVacationData] Processed vacation:', {
              id: vacation.id,
              employeeId: vacation.employeeId,
              employeeName: vacation.employeeName,
              startDate: vacation.startDate.toISOString().split('T')[0],
              endDate: vacation.endDate.toISOString().split('T')[0],
              status: vacation.status
            });
            
            return vacation;
          });
          
          console.log('[useVacationData] Formatted vacations with consistent employeeId mapping:', formattedVacations.length);
          setVacations(formattedVacations);
        } else {
          setVacations([]);
        }
      }
    } catch (err) {
      console.error('[useVacationData] Error fetching vacations:', err);
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
  
  // Subscribe to vacation changes with improved handling
  useEffect(() => {
    console.log('[useVacationData] Setting up optimized vacation realtime subscription...');
    
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
          console.log('[useVacationData] Received vacation change event:', payload.eventType, payload);
          
          // Use different strategies based on the event type for better performance
          if (payload.eventType === 'DELETE') {
            console.log('[useVacationData] Vacation deleted:', payload.old.id);
            // Remove the deleted vacation from the local state without refetch
            setVacations(current => 
              current.filter(v => v.id !== payload.old.id)
            );
          } else {
            // For INSERT and UPDATE, refresh the entire list to ensure consistency
            // This benefits from the optimized queries and indexes
            console.log('[useVacationData] Refreshing vacation list due to', payload.eventType);
            fetchVacations();
          }
        }
      )
      .subscribe((status) => {
        console.log('[useVacationData] Vacation realtime subscription status:', status);
      });
      
    return () => {
      console.log('[useVacationData] Cleaning up vacation realtime subscription');
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
