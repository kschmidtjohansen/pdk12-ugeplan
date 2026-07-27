import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { CarUnavailabilityService, CarUnavailability } from '@/services/carUnavailabilityService';
import { subscribeToTable } from '@/lib/realtimeChannels';

export const useCarUnavailability = () => {
  const { user, userDataLoaded, isDemoMode } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const queryClient = useQueryClient();

  const queryKey = ['car-unavailability', selectedDepartmentId] as const;

  const { data: periods = [], refetch } = useQuery({
    queryKey,
    queryFn: () => CarUnavailabilityService.listActive(selectedDepartmentId ?? undefined),
    enabled: !isDemoMode && userDataLoaded && !!user && !!selectedDepartmentId,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (isDemoMode || !user) return;
    const unsub = subscribeToTable({
      key: `useCarUnavailability:${user.id}`,
      table: 'car_unavailability',
      callback: () => {
        queryClient.invalidateQueries({ queryKey: ['car-unavailability'] });
        queryClient.invalidateQueries({ queryKey: ['cars'] });
      },
    });
    return () => unsub();
  }, [isDemoMode, user?.id, queryClient]);

  return { periods: periods as CarUnavailability[], refetch };
};
