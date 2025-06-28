
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OptimizedAssignmentService, OptimizedAssignmentData } from '@/services/optimizedAssignmentService';
import { Assignment, normalizeEmployees } from '@/types/assignment';
import { useToast } from '@/components/ui/use-toast';
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
}

// Helper function to convert OptimizedAssignmentData to Assignment
const convertToAssignment = (data: OptimizedAssignmentData): Assignment => {
  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    date: data.date,
    fromTime: data.fromTime,
    toTime: data.toTime,
    location: data.location,
    type: data.type,
    published: data.published,
    responsibleUserId: data.responsible_user_id || undefined,
    employees: normalizeEmployees(data.employees),
    car: data.cars.length > 0 ? data.cars[0].id : '',
    cars: data.cars.map(car => car.id),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    responsibleUser: data.responsible_user
  };
};

export const useOptimizedAssignments = (filter: FilterType = 'all'): UseOptimizedAssignmentsResult => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [operationStates, setOperationStates] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  const setOperationState = useCallback((id: string, state: 'idle' | 'loading' | 'success' | 'error') => {
    setOperationStates(prev => ({ ...prev, [id]: state }));
  }, []);

  const fetchAssignments = useCallback(async () => {
    if (!user?.id) {
      console.log('[useOptimizedAssignments] No user ID available, skipping fetch');
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log(`[useOptimizedAssignments] Fetching assignments with filter: ${filter} for user: ${user.name} (${user.role})`);
      
      let result: OptimizedAssignmentData[];
      
      switch (filter) {
        case 'all':
          result = await OptimizedAssignmentService.fetchAllAssignments(user.role);
          break;
        case 'published':
          // CRITICAL FIX: For servicemedarbejder, fetch ALL published assignments (not user-specific)
          if (user.role === 'servicemedarbejder') {
            result = await OptimizedAssignmentService.fetchAllPublishedAssignments();
          } else {
            result = await OptimizedAssignmentService.fetchPublishedAssignments(user.id, user.role);
          }
          break;
        case 'unpublished':
          result = await OptimizedAssignmentService.fetchUnpublishedAssignments(user.id, user.role);
          break;
        case 'user':
          result = await OptimizedAssignmentService.fetchUserAssignments(user.id, user.role);
          break;
        default:
          result = [];
      }

      // Convert OptimizedAssignmentData to Assignment format
      const convertedAssignments = result.map(convertToAssignment);

      console.log(`[useOptimizedAssignments] Successfully fetched ${convertedAssignments.length} assignments`);
      console.log(`[useOptimizedAssignments] Sample assignment data:`, convertedAssignments[0]);
      setAssignments(convertedAssignments);
    } catch (err) {
      console.error('[useOptimizedAssignments] Error fetching assignments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, user?.name, filter]);

  const refetch = useCallback(async () => {
    setLoading(true);
    // Clear cache before refetching
    OptimizedAssignmentService.clearCache();
    await fetchAssignments();
  }, [fetchAssignments]);

  // Placeholder implementations for CRUD operations
  const createAssignment = useCallback(async (data: Partial<Assignment>) => {
    console.log('[useOptimizedAssignments] Create assignment not yet implemented', data);
    toast({
      title: t('common.info'),
      description: t('dashboard.functionalityNotImplemented')
    });
  }, [toast, t]);

  const updateAssignment = useCallback(async (id: string, data: Partial<Assignment>) => {
    console.log('[useOptimizedAssignments] Update assignment not yet implemented', id, data);
    toast({
      title: t('common.info'),
      description: t('dashboard.functionalityNotImplemented')
    });
  }, [toast, t]);

  const deleteAssignment = useCallback(async (id: string) => {
    setOperationState(id, 'loading');
    try {
      console.log('[useOptimizedAssignments] Delete assignment not yet implemented', id);
      toast({
        title: t('common.info'),
        description: t('dashboard.functionalityNotImplemented')
      });
      setOperationState(id, 'success');
    } catch (error) {
      console.error('[useOptimizedAssignments] Delete failed:', error);
      setOperationState(id, 'error');
    }
  }, [toast, t, setOperationState]);

  const publishAssignment = useCallback(async (id: string) => {
    setOperationState(id, 'loading');
    try {
      console.log('[useOptimizedAssignments] Publish assignment not yet implemented', id);
      toast({
        title: t('common.info'),
        description: t('dashboard.functionalityNotImplemented')
      });
      setOperationState(id, 'success');
    } catch (error) {
      console.error('[useOptimizedAssignments] Publish failed:', error);
      setOperationState(id, 'error');
    }
  }, [toast, t, setOperationState]);

  const publishAssignmentsByDate = useCallback(async (date: string) => {
    try {
      console.log('[useOptimizedAssignments] Publish assignments by date not yet implemented', date);
      toast({
        title: t('common.info'),
        description: t('dashboard.functionalityNotImplemented')
      });
    } catch (error) {
      console.error('[useOptimizedAssignments] Publish by date failed:', error);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

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
    publishAssignmentsByDate
  };
};
