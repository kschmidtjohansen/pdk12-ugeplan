
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { Vacation, VacationRequestType } from '@/types/vacation';
import { logSecurityEvent, logSystemError } from '@/utils/securityLogger';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { dataFetchingService } from '@/services/dataFetchingService';
import { realtimeManager } from '@/services/realtimeManager';

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

      

      const result = await executeWithRecovery(
        async () => {
          const { data: vacationsData, error: vacationsError, fromCache } = await dataFetchingService.fetchVacations();
          
          if (vacationsError) throw vacationsError;
          
          
          return vacationsData;
        },
        'Vacation Data Fetch'
      );

      if (result.error || !result.data) {
        throw result.error || new Error('No vacation data received');
      }

      const vacationsData = result.data;

      // Fetch user profiles separately with error recovery
      const userIds = [...new Set(vacationsData.map(v => v.user_id).filter(id => typeof id === 'string'))] as string[];
      
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

  // Use centralized realtime manager for vacation subscriptions
  useEffect(() => {
    
    
    const subscriptionId = 'vacations_enhanced';
    
    const handleRealtimeUpdate = () => {
      dataFetchingService.clearCache('vacations');
      fetchVacations();
      
      // Log realtime data changes for monitoring
      logSecurityEvent(
        'vacation_realtime_change',
        'Vacation change detected via centralized realtime manager',
        { 
          subscription_id: subscriptionId,
          timestamp: new Date().toISOString()
        },
        'info'
      );
    };

    const subscription = realtimeManager.subscribe(
      subscriptionId,
      ['vacations'],
      handleRealtimeUpdate
    );

    if (!subscription) {
      const pollInterval = setInterval(() => {
        fetchVacations();
      }, 30000);
      
      return () => clearInterval(pollInterval);
    }

    return () => {
      realtimeManager.unsubscribe(subscriptionId);
    };
  }, [fetchVacations]);

  return {
    vacations,
    loading,
    error,
    fetchVacations
  };
};
