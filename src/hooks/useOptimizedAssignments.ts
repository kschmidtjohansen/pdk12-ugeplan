import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OptimizedAssignmentService, OptimizedAssignmentData } from '@/services/optimizedAssignmentService';
import { Assignment, normalizeEmployees } from '@/types/assignment';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';

export type FilterType = 'all' | 'published' | 'unpublished' | 'user';
export type AssignmentFilter = FilterType; // Export for compatibility

interface UseOptimizedAssignmentsResult {
  assignments: Assignment[];
  loading: boolean;
  error: Error | null;
  operationStates: Record<string, 'idle' | 'loading' | 'success' | 'error'>;
  refetch: () => Promise<void>;
  createAssignment: (data: Partial<Assignment>) => Promise<void>;
  updateAssignment: (id: string, data: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  publishAssignment: (id: string) => Promise<void>;
  publishAssignmentsByDate: (date: string) => Promise<void>;
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
}

// Helper function to convert OptimizedAssignmentData to Assignment
const convertToAssignment = (data: OptimizedAssignmentData): Assignment => {
  // Convert assignment_employees to employee names array
  const employees = data.assignment_employees?.map(emp => emp.profiles.name).filter(Boolean) || [];
  
  // Handle car data - support both legacy car_id and new car_ids array
  let cars: string[] = [];
  let firstCar = '';
  
  if (data.assignment_cars && data.assignment_cars.length > 0) {
    // Use the enriched car data from the service
    cars = data.assignment_cars.map(car => car.id);
    firstCar = cars[0] || '';
  } else if (data.car_ids && Array.isArray(data.car_ids) && data.car_ids.length > 0) {
    // Fallback to car_ids array
    cars = data.car_ids;
    firstCar = cars[0] || '';
  } else if (data.car_id) {
    // Legacy single car_id
    cars = [data.car_id];
    firstCar = data.car_id;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    date: data.assignment_date,
    fromTime: data.from_time,
    toTime: data.to_time,
    location: data.location,
    type: data.type,
    published: data.published,
    responsibleUserId: data.responsible_user_id || undefined,
    employees: employees,
    car: firstCar,
    cars: cars,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    responsibleUser: data.responsible_user
  };
};

export const useOptimizedAssignments = (filter: FilterType = 'all'): UseOptimizedAssignmentsResult => {
  const { user, isAuthenticated, authReady } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [operationStates, setOperationStates] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  // Early return if authentication not ready
  if (!authReady) {
    return {
      assignments: [],
      loading: true,
      error: null,
      operationStates,
      refetch: async () => {},
      createAssignment: async () => {},
      updateAssignment: async () => {},
      deleteAssignment: async () => {},
      publishAssignment: async () => {},
      publishAssignmentsByDate: async () => {},
      setAssignments: () => {}
    };
  }

  // If not authenticated, return empty state
  if (!isAuthenticated || !user) {
    return {
      assignments: [],
      loading: false,
      error: new Error('User not authenticated'),
      operationStates,
      refetch: async () => {},
      createAssignment: async () => {},
      updateAssignment: async () => {},
      deleteAssignment: async () => {},
      publishAssignment: async () => {},
      publishAssignmentsByDate: async () => {},
      setAssignments: () => {}
    };
  }

  const setOperationState = useCallback((id: string, state: 'idle' | 'loading' | 'success' | 'error') => {
    setOperationStates(prev => ({ ...prev, [id]: state }));
  }, []);

  const fetchAssignments = useCallback(async () => {
    if (!user?.id || !user?.role) {
      console.log('[useOptimizedAssignments] User not authenticated or role not available, skipping fetch');
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log(`[useOptimizedAssignments] ⭐ CRITICAL DEBUG: Fetching assignments with filter: ${filter} for user: ${user.email} (${user.role})`);
      
      let result: OptimizedAssignmentData[];
      
      switch (filter) {
        case 'all':
          console.log('[useOptimizedAssignments] ⭐ FILTER MATCH: all - calling fetchAllAssignments');
          result = await OptimizedAssignmentService.fetchAllAssignments(user.role);
          break;
        case 'published':
          console.log('[useOptimizedAssignments] ⭐ FILTER MATCH: published - calling fetchAllPublishedAssignments');
          result = await OptimizedAssignmentService.fetchAllPublishedAssignments();
          break;
        case 'unpublished':
          console.log('[useOptimizedAssignments] ⭐ FILTER MATCH: unpublished - calling fetchUnpublishedAssignments');
          result = await OptimizedAssignmentService.fetchUnpublishedAssignments(user.id, user.role);
          break;
        case 'user':
          console.log('[useOptimizedAssignments] ⭐ FILTER MATCH: user - calling fetchUserAssignments');
          result = await OptimizedAssignmentService.fetchUserAssignments(user.id, user.role);
          break;
        default:
          console.log('[useOptimizedAssignments] ⭐ FILTER MATCH: default - no assignments');
          result = [];
      }

      // Convert OptimizedAssignmentData to Assignment format
      const convertedAssignments = result.map(convertToAssignment);

      console.log(`[useOptimizedAssignments] Successfully fetched ${convertedAssignments.length} assignments`);
      if (convertedAssignments.length > 0) {
        console.log(`[useOptimizedAssignments] Sample assignment data:`, convertedAssignments[0]);
      }
      setAssignments(convertedAssignments);
    } catch (err) {
      console.error('[useOptimizedAssignments] Error fetching assignments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, user?.email, filter]);

  const refetch = useCallback(async () => {
    setLoading(true);
    // Clear cache before refetching
    OptimizedAssignmentService.clearCache();
    await fetchAssignments();
  }, [fetchAssignments]);

  const createAssignment = useCallback(async (data: Partial<Assignment>) => {
    console.log('[useOptimizedAssignments] Create assignment not yet implemented', data);
    toast({
      title: t('common.info'),
      description: t('dashboard.functionalityNotImplemented')
    });
  }, [toast, t]);

  const updateAssignment = useCallback(async (id: string, data: Partial<Assignment>) => {
    setOperationState(id, 'loading');
    try {
      console.log('[useOptimizedAssignments] Updating assignment:', id);
      
      // Optimistically update the UI
      setAssignments(prev => prev.map(assignment => 
        assignment.id === id ? { ...assignment, ...data } : assignment
      ));
      
      // Convert Assignment data to OptimizedAssignmentData format for service
      const serviceData = {
        title: data.title,
        description: data.description,
        assignment_date: data.date,
        from_time: data.fromTime,
        to_time: data.toTime,
        location: data.location,
        published: data.published,
        responsible_user_id: data.responsibleUserId,
        car_id: typeof data.car === 'string' ? data.car : undefined,
        car_ids: data.cars
      };
      
      await OptimizedAssignmentService.updateAssignment(id, serviceData);
      
      toast({
        title: t('planner.assignmentUpdated'),
        description: t('planner.assignmentUpdatedMsg', { title: data.title })
      });
      
      setOperationState(id, 'success');
      
      // Refetch to get updated data
      await refetch();
    } catch (error) {
      console.error('[useOptimizedAssignments] Update failed:', error);
      setOperationState(id, 'error');
      
      // Revert optimistic update on error
      await refetch();
      
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('planner.errorUpdatingAssignment'),
        variant: "destructive"
      });
    }
  }, [toast, t, setOperationState, refetch, setAssignments]);

  const deleteAssignment = useCallback(async (id: string) => {
    setOperationState(id, 'loading');
    try {
      console.log('[useOptimizedAssignments] Deleting assignment:', id);
      
      // Optimistically remove from UI
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
      
      await OptimizedAssignmentService.deleteAssignment(id);
      
      toast({
        title: t('planner.assignmentDeleted'),
        description: t('planner.assignmentDeletedMsg')
      });
      
      setOperationState(id, 'success');
      
      // Refetch to ensure consistency
      await refetch();
    } catch (error) {
      console.error('[useOptimizedAssignments] Delete failed:', error);
      setOperationState(id, 'error');
      
      // Revert optimistic update on error
      await refetch();
      
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('planner.errorDeletingAssignment'),
        variant: "destructive"
      });
    }
  }, [toast, t, setOperationState, refetch, setAssignments]);

  const publishAssignment = useCallback(async (id: string) => {
    setOperationState(id, 'loading');
    try {
      console.log('[useOptimizedAssignments] Publishing assignment:', id);
      
      // Optimistically update the UI
      setAssignments(prev => prev.map(assignment => 
        assignment.id === id ? { ...assignment, published: true } : assignment
      ));
      
      await OptimizedAssignmentService.publishAssignment(id);
      
      toast({
        title: t('planner.assignmentPublished'),
        description: t('planner.assignmentPublishedMsg')
      });
      
      setOperationState(id, 'success');
      
      // Refetch to get updated data
      await refetch();
    } catch (error) {
      console.error('[useOptimizedAssignments] Publish failed:', error);
      setOperationState(id, 'error');
      
      // Revert optimistic update on error
      await refetch();
      
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('planner.errorPublishingAssignment'),
        variant: "destructive"
      });
    }
  }, [toast, t, setOperationState, refetch, setAssignments]);

  const publishAssignmentsByDate = useCallback(async (date: string) => {
    try {
      console.log('[useOptimizedAssignments] Publishing assignments by date:', date);
      
      // Optimistically update all assignments for the date
      setAssignments(prev => prev.map(assignment => 
        assignment.date === date ? { ...assignment, published: true } : assignment
      ));
      
      await OptimizedAssignmentService.publishAssignmentsByDate(date);
      
      toast({
        title: t('planner.dayPublished'),
        description: t('planner.dayPublishedMsg', { date })
      });
      
      // Refetch to get updated data
      await refetch();
    } catch (error) {
      console.error('[useOptimizedAssignments] Publish by date failed:', error);
      
      // Revert optimistic update on error
      await refetch();
      
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('planner.errorPublishingDay'),
        variant: "destructive"
      });
    }
  }, [toast, t, refetch, setAssignments]);

  useEffect(() => {
    if (authReady && isAuthenticated && user?.id && user?.role) {
      fetchAssignments();
    }
  }, [fetchAssignments, authReady, isAuthenticated, user?.id, user?.role]);

  return {
    assignments,
    loading,
    error,
    operationStates,
    refetch,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate,
    setAssignments
  };
};
