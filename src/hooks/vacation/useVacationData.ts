
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { Vacation, VacationRequestType } from '@/types/vacation';
import { logSecurityEvent, logSystemError } from '@/utils/securityLogger';

export const useVacationData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVacations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[useVacationData] Fetching vacations with enhanced security...');

      // Log data access attempt
      await logSecurityEvent(
        'vacation_data_access',
        'User accessing vacation data',
        { action: 'fetch_vacations' },
        'info'
      );

      const { data: vacationsData, error: vacationsError } = await supabase
        .from('vacations')
        .select(`
          id,
          user_id,
          start_date,
          end_date,
          request_type,
          start_time,
          end_time,
          is_same_day,
          status,
          reason,
          notes,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (vacationsError) {
        console.error('[useVacationData] Error fetching vacations:', vacationsError);
        
        // Log security event for data access failure
        await logSecurityEvent(
          'vacation_data_access_failed',
          'Failed to fetch vacation data',
          { error: vacationsError.message, code: vacationsError.code },
          'error'
        );
        
        throw vacationsError;
      }

      // Fetch user profiles separately
      const userIds = [...new Set(vacationsData?.map(v => v.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('[useVacationData] Error fetching profiles:', profilesError);
        await logSystemError('useVacationData', profilesError, { context: 'profile_fetch' });
      }

      console.log(`[useVacationData] Successfully fetched ${vacationsData?.length || 0} vacations`);

      // Transform the data to match our Vacation interface
      const transformedVacations: Vacation[] = (vacationsData || []).map(vacation => {
        const userProfile = profilesData?.find(p => p.id === vacation.user_id);
        
        return {
          id: vacation.id,
          user_id: vacation.user_id,
          start_date: vacation.start_date,
          end_date: vacation.end_date,
          request_type: (vacation.request_type as VacationRequestType) || 'full_day',
          start_time: vacation.start_time || undefined,
          end_time: vacation.end_time || undefined,
          is_same_day: vacation.is_same_day ?? true,
          status: vacation.status,
          reason: vacation.reason || undefined,
          notes: vacation.notes || undefined,
          created_at: vacation.created_at,
          updated_at: vacation.updated_at,
          user: userProfile ? {
            id: userProfile.id,
            name: userProfile.name || 'Unknown',
            email: userProfile.email || ''
          } : undefined
        };
      });

      setVacations(transformedVacations);
      console.log('[useVacationData] Vacation data transformed and set');

    } catch (err) {
      console.error('[useVacationData] Error in fetchVacations:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Log system error
      await logSystemError('useVacationData', err, { context: 'fetch_vacations' });
      
      toast({
        title: t('common.error') || 'Error',
        description: t('vacation.fetchError') || 'Error loading vacation requests',
        variant: 'destructive',
      });
      
      setVacations([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  // Load vacations on component mount
  useEffect(() => {
    fetchVacations();
  }, [fetchVacations]);

  // Set up realtime subscription for vacation changes
  useEffect(() => {
    console.log('[useVacationData] Setting up realtime subscription...');
    
    let timeoutId: NodeJS.Timeout;
    
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('[useVacationData] Realtime refresh triggered');
        fetchVacations();
      }, 1000);
    };
    
    const channel = supabase
      .channel('vacations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vacations'
        },
        (payload) => {
          console.log('[useVacationData] Received vacation change:', payload.eventType);
          
          // Log realtime data changes for monitoring
          logSecurityEvent(
            'vacation_realtime_change',
            `Vacation ${payload.eventType} detected via realtime`,
            { 
              event_type: payload.eventType, 
              table: 'vacations',
              record_id: payload.new?.id || payload.old?.id 
            },
            'info'
          );
          
          debouncedRefresh();
        }
      )
      .subscribe((status) => {
        console.log('[useVacationData] Realtime subscription status:', status);
      });

    return () => {
      console.log('[useVacationData] Cleaning up realtime subscription');
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [fetchVacations]);

  return {
    vacations,
    loading,
    error,
    fetchVacations
  };
};
