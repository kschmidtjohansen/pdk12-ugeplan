
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { Vacation, VacationRequestType } from '@/types/vacation';
import { logSecurityEvent, logSystemError } from '@/utils/securityLogger';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { dataFetchingService } from '@/services/dataFetchingService';

export const useVacationData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { executeWithRecovery } = useErrorRecovery();

  const fetchVacations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[useVacationData] Fetching vacations with enhanced error handling...');

      const result = await executeWithRecovery(
        async () => {
          const { data: vacationsData, error: vacationsError, fromCache } = await dataFetchingService.fetchVacations();
          
          if (vacationsError) throw vacationsError;
          
          if (fromCache) {
            console.log('[useVacationData] Using cached vacation data');
          }
          
          return vacationsData;
        },
        'Vacation Data Fetch'
      );

      if (result.error || !result.data) {
        throw result.error || new Error('No vacation data received');
      }

      const vacationsData = result.data;

      // Fetch user profiles separately with error recovery
      const userIds = [...new Set(vacationsData.map(v => v.user_id))];
      
      const profileResult = await executeWithRecovery(
        async () => {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', userIds);

          if (profilesError) throw profilesError;
          return profilesData;
        },
        'Vacation User Profiles Fetch'
      );

      console.log(`[useVacationData] Successfully processed ${vacationsData.length} vacations`);

      // Transform the data to match our Vacation interface
      const transformedVacations: Vacation[] = vacationsData.map(vacation => {
        const userProfile = profileResult.data?.find(p => p.id === vacation.user_id);
        
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
      console.log('[useVacationData] Vacation data transformed and set successfully');

    } catch (err) {
      console.error('[useVacationData] Error in fetchVacations:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Log system error with enhanced details
      await logSystemError('useVacationData', err, { 
        context: 'fetch_vacations',
        timestamp: new Date().toISOString()
      });
      
      // Don't show toast for authentication errors
      if (!errorMessage.includes('JWT') && !errorMessage.includes('auth')) {
        toast({
          title: t('common.error') || 'Error',
          description: t('vacation.fetchError') || 'Error loading vacation requests',
          variant: 'destructive',
        });
      }
      
      setVacations([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t, executeWithRecovery]);

  // Load vacations on component mount
  useEffect(() => {
    fetchVacations();
  }, [fetchVacations]);

  // Set up enhanced realtime subscription
  useEffect(() => {
    console.log('[useVacationData] Setting up enhanced realtime subscription...');
    
    let timeoutId: NodeJS.Timeout;
    
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('[useVacationData] Debounced realtime refresh triggered');
        dataFetchingService.clearCache('vacations');
        fetchVacations();
      }, 1500);
    };
    
    const channel = supabase
      .channel('vacations_changes_enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vacations'
        },
        (payload) => {
          console.log('[useVacationData] Received vacation change:', payload.eventType);
          
          // Safely get record ID with proper type checking
          const recordId = (payload.new && typeof payload.new === 'object' && 'id' in payload.new) 
            ? payload.new.id 
            : (payload.old && typeof payload.old === 'object' && 'id' in payload.old) 
              ? payload.old.id 
              : 'unknown';
          
          // Log realtime data changes for monitoring
          logSecurityEvent(
            'vacation_realtime_change',
            `Vacation ${payload.eventType} detected via realtime`,
            { 
              event_type: payload.eventType, 
              table: 'vacations',
              record_id: recordId 
            },
            'info'
          );
          
          debouncedRefresh();
        }
      )
      .subscribe((status) => {
        console.log('[useVacationData] Realtime subscription status:', status);
        if (status === 'SUBSCRIPTION_ERROR') {
          console.error('[useVacationData] Realtime subscription failed, implementing fallback polling');
          // Fallback to polling if realtime fails
          const pollInterval = setInterval(() => {
            console.log('[useVacationData] Polling for updates (realtime failed)');
            fetchVacations();
          }, 30000); // Poll every 30 seconds
          
          return () => clearInterval(pollInterval);
        }
      });

    return () => {
      console.log('[useVacationData] Cleaning up enhanced realtime subscription');
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
