
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { supabase } from '@/integrations/supabase/client';
import { Vacation, VacationRequestType } from '@/types/vacation';
import { logSecurityEvent, logSystemError } from '@/utils/securityLogger';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { enhancedDataFetching } from '@/services/enhancedDataFetching';
import { enhancedErrorHandler } from '@/services/enhancedErrorHandler';
import { realtimeManager } from '@/services/realtimeManager';
import { DemoUserService } from '@/services/demoUserService';
import { useAuth } from '@/context/AuthContext';

export const useVacationData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isDemoMode, userDataLoaded } = useAuth();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { executeWithRecovery } = useErrorRecovery();
  
  const demoService = DemoUserService.getInstance();
  const client = getSchemaClient(isDemoMode);

  const fetchVacations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[useVacationData] Starting enhanced vacation fetch...');

      // Use enhanced data fetching with better error handling
      const vacationResult = await enhancedDataFetching.fetchVacationsEnhanced(user?.email);
      
      if (vacationResult.error || !vacationResult.data) {
        throw vacationResult.error || new Error('No vacation data received');
      }

      const vacationsData = vacationResult.data;
      console.log(`[useVacationData] Fetched ${vacationsData.length} vacation records`);

      // Fetch user profiles with enhanced error handling
      const userIds = [...new Set(vacationsData.map(v => v.user_id).filter(id => typeof id === 'string'))] as string[];
      
      const profileResult = await enhancedDataFetching.fetchUserProfilesEnhanced(userIds, user?.email);
      
      if (profileResult.error) {
        console.warn('[useVacationData] Profile fetch failed, continuing with vacation data only:', profileResult.error);
        // Log warning but don't fail the entire operation
        await enhancedErrorHandler.logError(profileResult.error, {
          operation: 'fetchUserProfilesForVacations',
          userId: undefined,
          retryCount: (profileResult as any).retryCount || 0,
          additionalData: { userIdsCount: userIds.length }
        });
      }

      // Fetch employees as fallback for user names
      const employeesResult = await enhancedDataFetching.fetchEmployeesEnhanced(user?.email);
      const employees = employeesResult.data || [];

      // Transform the data to match our Vacation interface
      const transformedVacations: Vacation[] = vacationsData.map(vacation => {
        // Try profile first, then employees, then default
        let userProfile = profileResult.data?.find(p => p.id === vacation.user_id);
        
        if (!userProfile && employees.length > 0) {
          const employee = employees.find((e: any) => e.id === vacation.user_id);
          if (employee) {
            userProfile = { 
              id: employee.id, 
              name: employee.name, 
              email: employee.email,
              status: employee.status 
            };
          }
        }
        
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
            name: userProfile.name || 'Demo Medarbejder',
            email: userProfile.email || ''
          } : {
            id: vacation.user_id,
            name: 'Demo Medarbejder',
            email: ''
          }
        };
      });

      // Schema isolation handles data separation - no filtering needed
      setVacations(transformedVacations);
      console.log(`[useVacationData] Successfully processed ${transformedVacations.length} vacation records`);

    } catch (err) {
      console.error('[useVacationData] Error in fetchVacations:', err);
      
      // Enhanced error handling with proper serialization
      const serializedError = enhancedErrorHandler.serializeError(err);
      const category = enhancedErrorHandler.categorizeError(serializedError);
      const userFriendlyMessage = enhancedErrorHandler.getUserFriendlyMessage(serializedError, category);
      
      setError(userFriendlyMessage);
      
      // Log error with enhanced context
      await enhancedErrorHandler.logError(err, {
        operation: 'fetchVacations',
        additionalData: { 
          context: 'useVacationData',
          component: 'vacation_data_hook',
          category
        }
      });
      
      // Only show toast for non-auth errors to avoid spam
      if (category !== 'auth') {
        toast({
          title: t('common.error') || 'Error',
          description: userFriendlyMessage,
          variant: 'destructive',
        });
      }
      
      setVacations([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t, user?.email]);

  // Load vacations on component mount - wait for userDataLoaded to stabilize
  useEffect(() => {
    if (!userDataLoaded || !user) return;
    fetchVacations();
  }, [fetchVacations, userDataLoaded, user?.id]);

  // Use centralized realtime manager for vacation subscriptions (or polling for demo)
  useEffect(() => {
    if (isDemoMode) {
      // Demo mode: Use polling instead of realtime
      const pollInterval = setInterval(() => {
        enhancedDataFetching.clearCache('vacations');
        fetchVacations();
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(pollInterval);
    } else {
      // Production mode: Use realtime subscriptions
      const subscriptionId = 'vacations_enhanced';
      
      const handleRealtimeUpdate = () => {
        enhancedDataFetching.clearCache('vacations');
        fetchVacations();
        
        // Log realtime data changes for monitoring with enhanced logging
        logSecurityEvent(
          'vacation_realtime_change',
          'Vacation change detected via centralized realtime manager',
          { 
            subscription_id: subscriptionId,
            timestamp: new Date().toISOString(),
            source: 'realtime_manager'
          },
          'info'
        );
      };

      const subscription = realtimeManager.subscribe(
        subscriptionId,
        ['vacations'],
        handleRealtimeUpdate,
        { schema: 'public' }
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
    }
  }, [fetchVacations, isDemoMode]);

  return {
    vacations,
    loading,
    error,
    fetchVacations
  };
};
