
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Vacation, VacationRequestType } from '@/types/vacation';
import { logSecurityEvent } from '@/utils/securityLogger';
import { enhancedDataFetching } from '@/services/enhancedDataFetching';
import { enhancedErrorHandler } from '@/services/enhancedErrorHandler';
import { realtimeManager } from '@/services/realtimeManager';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isDemoNonHomeDepartment } from '@/constants/demo';

export const useVacationData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isDemoMode, userDataLoaded } = useAuth();
  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();
  const queryClient = useQueryClient();

  const queryKey = ['vacations', user?.email, selectedDepartmentId, selectedSubDepartmentId] as const;

  const fetchVacationsFn = async (): Promise<Vacation[]> => {
    if (import.meta.env.DEV) console.log('[useVacationData] Starting enhanced vacation fetch...');

    if (isDemoNonHomeDepartment(isDemoMode, selectedDepartmentId)) {
      if (import.meta.env.DEV) console.log('[useVacationData] Non-home department in demo mode, returning empty');
      return [];
    }

    const vacationResult = await enhancedDataFetching.fetchVacationsEnhanced(user?.email, selectedDepartmentId, selectedSubDepartmentId);
    if (vacationResult.error || !vacationResult.data) {
      throw vacationResult.error || new Error('No vacation data received');
    }

    const vacationsData = vacationResult.data;
    if (import.meta.env.DEV) console.log(`[useVacationData] Fetched ${vacationsData.length} vacation records`);

    const userIds = [...new Set(vacationsData.map(v => v.user_id).filter(id => typeof id === 'string'))] as string[];
    const profileResult = await enhancedDataFetching.fetchUserProfilesEnhanced(userIds, user?.email);

    if (profileResult.error) {
      console.warn('[useVacationData] Profile fetch failed, continuing with vacation data only:', profileResult.error);
    }

    const employeesResult = await enhancedDataFetching.fetchEmployeesEnhanced(user?.email);
    const employees = employeesResult.data || [];

    const transformedVacations: Vacation[] = vacationsData.map(vacation => {
      let userProfile = profileResult.data?.find(p => p.id === vacation.user_id);

      if (!userProfile && employees.length > 0) {
        const employee = employees.find((e: any) => e.id === vacation.user_id);
        if (employee) {
          userProfile = { id: employee.id, name: employee.name, email: employee.email, status: employee.status };
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

    const today = new Date().toISOString().split('T')[0];
    const currentAndFutureVacations = transformedVacations.filter(vacation =>
      vacation.end_date >= today || vacation.status === 'pending'
    );

    if (import.meta.env.DEV) console.log(`[useVacationData] Filtered ${transformedVacations.length} to ${currentAndFutureVacations.length} current/future vacation records`);
    return currentAndFutureVacations;
  };

  const { data: vacations = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey,
    queryFn: fetchVacationsFn,
    enabled: userDataLoaded && !!user && (isDemoMode || !!selectedDepartmentId),
    staleTime: 5 * 60 * 1000,
  });

  // Show error toasts
  useEffect(() => {
    if (!queryError) return;
    const serializedError = enhancedErrorHandler.serializeError(queryError);
    const category = enhancedErrorHandler.categorizeError(serializedError);
    const userFriendlyMessage = enhancedErrorHandler.getUserFriendlyMessage(serializedError, category);

    if (category !== 'auth' && !isDemoMode) {
      toast({ title: t('common.error') || 'Error', description: userFriendlyMessage, variant: 'destructive' });
    }
  }, [queryError]);

  // Realtime / polling
  useEffect(() => {
    if (isDemoMode) {
      const pollInterval = setInterval(() => {
        enhancedDataFetching.clearCache('vacations');
        queryClient.invalidateQueries({ queryKey: ['vacations'] });
      }, 30000);
      return () => clearInterval(pollInterval);
    } else {
      const subscriptionId = 'vacations_enhanced';

      const handleRealtimeUpdate = () => {
        enhancedDataFetching.clearCache('vacations');
        queryClient.invalidateQueries({ queryKey: ['vacations'] });
      };

      const subscription = realtimeManager.subscribe(subscriptionId, ['vacations'], handleRealtimeUpdate, { schema: 'public' });

      if (!subscription) {
        const pollInterval = setInterval(() => {
          queryClient.invalidateQueries({ queryKey: ['vacations'] });
        }, 30000);
        return () => clearInterval(pollInterval);
      }

      return () => { realtimeManager.unsubscribe(subscriptionId); };
    }
  }, [isDemoMode, queryClient]);

  const fetchVacations = async () => { await refetch(); };

  return {
    vacations,
    loading,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Error') : null,
    fetchVacations
  };
};
