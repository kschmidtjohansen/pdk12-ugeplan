import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useEmployeeData } from '@/hooks/employee/useEmployeeData';
import { fetchAssignmentsForQuery } from '@/hooks/useOptimizedAssignments';

const HOVER_PREFETCH_DELAY_MS = 150;

/**
 * Prefetch assignments when hovering the week arrows, debounced so quick mouse
 * movements don't trigger redundant calls. Query key matches useOptimizedAssignments('all').
 */
export function useAdjacentWeekPrefetch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();
  const { employees: allEmployees } = useEmployeeData();
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runPrefetchAssignments = useCallback(() => {
    if (!user?.id || !user?.role) return;
    queryClient.prefetchQuery({
      queryKey: ['assignments', user.id, user.role, 'all', selectedDepartmentId, selectedSubDepartmentId],
      queryFn: () => fetchAssignmentsForQuery({
        userId: user.id,
        userRole: user.role,
        userEmail: user.email,
        filter: 'all',
        selectedDepartmentId,
        selectedSubDepartmentId,
        allEmployees,
      }),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient, user?.id, user?.role, user?.email, selectedDepartmentId, selectedSubDepartmentId, allEmployees]);

  const handlePrefetchAssignments = useCallback(() => {
    if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    prefetchTimerRef.current = setTimeout(() => {
      prefetchTimerRef.current = null;
      runPrefetchAssignments();
    }, HOVER_PREFETCH_DELAY_MS);
  }, [runPrefetchAssignments]);

  const handleCancelPrefetch = useCallback(() => {
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    };
  }, []);

  return { handlePrefetchAssignments, handleCancelPrefetch };
}
