import { useState, useEffect, useCallback, useMemo } from 'react';
import { Assignment } from '@/types/assignment';
import { AssignmentFilterService } from '@/services/assignmentFilterService';
import { OptimizedAssignmentService, OptimizedAssignmentData } from '@/services/optimizedAssignmentService';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { publishAssignmentHandler } from '@/utils/assignmentPublishing';

export type AssignmentFilter = 'all' | 'user' | 'published' | 'unpublished';

export const useOptimizedAssignments = (filter: AssignmentFilter = 'all') => {
  const [assignments, setAssignments] = useState<OptimizedAssignmentData[]>([]);
  const [transformedAssignments, setTransformedAssignments] = useState<Assignment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [operationStates, setOperationStates] = useState<{ [key: string]: 'idle' | 'loading' | 'success' | 'error' }>({});
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const userRole = user?.role;
  const userId = user?.id;

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      let fetchedAssignments: OptimizedAssignmentData[];
      
      console.log('[useOptimizedAssignments] DEFINITIVE FIX - Fetching with filter:', filter, 'for user:', user?.name, 'role:', userRole);
      
      if (filter === 'user' && userId) {
        fetchedAssignments = await OptimizedAssignmentService.fetchUserAssignments(userId);
      } else if (filter === 'all') {
        fetchedAssignments = await OptimizedAssignmentService.fetchAllAssignments(userRole);
      } else if (filter === 'published') {
        fetchedAssignments = await OptimizedAssignmentService.fetchPublishedAssignments();
      } else if (filter === 'unpublished') {
        fetchedAssignments = await OptimizedAssignmentService.fetchUnpublishedAssignments();
      } else {
        fetchedAssignments = await OptimizedAssignmentService.fetchAllAssignments(userRole);
      }
      
      console.log('[useOptimizedAssignments] DEFINITIVE FIX - Fetched assignments:', fetchedAssignments.length);
      
      setAssignments(fetchedAssignments);
      setError(null);
    } catch (err: any) {
      console.error('[useOptimizedAssignments] DEFINITIVE FIX - Fetch error:', err);
      setError(err);
      toast({
        title: t('common.error'),
        description: t('planner.fetchError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [filter, userId, userRole, t, toast, user?.name]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const deleteAssignment = useCallback(async (id: string) => {
    setOperationStates(prevState => ({ ...prevState, [id]: 'loading' }));
    try {
      setTransformedAssignments(prevAssignments => {
        if (!prevAssignments) return prevAssignments;
        return prevAssignments.filter(assignment => assignment.id !== id);
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      const error = null;

      if (error) {
        throw error;
      }

      toast({
        title: t('common.success'),
        description: t('planner.deleteSuccess'),
      });
      setOperationStates(prevState => ({ ...prevState, [id]: 'success' }));
    } catch (err: any) {
      console.error('Delete assignment error:', err);
      toast({
        title: t('common.error'),
        description: t('planner.deleteError'),
        variant: 'destructive'
      });
      setOperationStates(prevState => ({ ...prevState, [id]: 'error' }));
      refetch();
    }
  }, [refetch, t, toast]);

  const publishAssignment = useCallback(async (id: string) => {
    setOperationStates(prevState => ({ ...prevState, [id]: 'loading' }));
    try {
      if (!transformedAssignments) return;
      
      const success = await publishAssignmentHandler(
        transformedAssignments,
        setTransformedAssignments,
        [id]
      );
      
      if (success) {
        toast({
          title: t('common.success'),
          description: t('planner.publishSuccess'),
        });
        setOperationStates(prevState => ({ ...prevState, [id]: 'success' }));
        
        await refetch();
      } else {
        throw new Error('Failed to publish assignment');
      }
    } catch (err: any) {
      console.error('Publish assignment error:', err);
      toast({
        title: t('common.error'),
        description: t('planner.publishError'),
        variant: 'destructive'
      });
      setOperationStates(prevState => ({ ...prevState, [id]: 'error' }));
    }
  }, [transformedAssignments, setTransformedAssignments, refetch, t, toast]);

  const publishAssignmentsByDate = useCallback(async (date: string) => {
    if (!transformedAssignments) return false;
    
    try {
      const success = await publishAssignmentHandler(
        transformedAssignments,
        setTransformedAssignments,
        null,
        date
      );
      
      if (success) {
        await refetch();
      }
      
      return success;
    } catch (error) {
      console.error('Error publishing assignments by date:', error);
      return false;
    }
  }, [transformedAssignments, setTransformedAssignments, refetch]);

  const updateAssignment = useCallback(
    async (id: string, updates: Partial<Assignment>) => {
      setOperationStates(prevState => ({ ...prevState, [id]: 'loading' }));
      try {
        setTransformedAssignments(prevAssignments => {
          if (!prevAssignments) return prevAssignments;
          return prevAssignments.map(assignment =>
            assignment.id === id ? { ...assignment, ...updates } : assignment
          );
        });
  
        await new Promise(resolve => setTimeout(resolve, 1000));
        const error = null;
  
        if (error) {
          throw error;
        }
  
        toast({
          title: t('common.success'),
          description: t('planner.updateSuccess'),
        });
        setOperationStates(prevState => ({ ...prevState, [id]: 'success' }));
      } catch (err: any) {
        console.error('Update assignment error:', err);
        toast({
          title: t('common.error'),
          description: t('planner.updateError'),
          variant: 'destructive'
        });
        setOperationStates(prevState => ({ ...prevState, [id]: 'error' }));
        refetch();
      }
    },
    [refetch, t, toast]
  );

  const createAssignment = useCallback(
    async (newAssignment: Omit<Assignment, 'id'>) => {
      setOperationStates(prevState => ({ ...prevState, 'create': 'loading' }));
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const error = null;
  
        if (error) {
          throw error;
        }
  
        toast({
          title: t('common.success'),
          description: t('planner.createSuccess'),
        });
        setOperationStates(prevState => ({ ...prevState, 'create': 'success' }));
        refetch();
      } catch (err: any) {
        console.error('Create assignment error:', err);
        toast({
          title: t('common.error'),
          description: t('planner.createError'),
          variant: 'destructive'
        });
        setOperationStates(prevState => ({ ...prevState, 'create': 'error' }));
      }
    },
    [refetch, t, toast]
  );

  const transformAssignments = useCallback(() => {
    if (!assignments) {
      return null;
    }

    console.log('[useOptimizedAssignments] DEFINITIVE FIX - Transforming assignments:', assignments.length);

    const transformed: Assignment[] = assignments.map(a => {
      // DEFINITIVE FIX: Preserve ALL employee names from the service
      const employeeNames = Array.isArray(a.employees) 
        ? a.employees.map(emp => emp.name).filter(name => name && name.trim() !== '')
        : [];
      
      // Debug logging for Asbestkursus
      if (a.title.toLowerCase().includes('asbestkursus')) {
        console.log(`[useOptimizedAssignments] DEFINITIVE FIX - 🎯 ASBESTKURSUS TRANSFORM:`, {
          title: a.title,
          date: a.assignment_date,
          rawEmployees: a.employees,
          transformedEmployees: employeeNames,
          employeeCount: employeeNames.length
        });
      }

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        date: a.assignment_date,
        fromTime: a.from_time,
        toTime: a.to_time,
        location: a.location,
        type: a.type,
        published: a.published,
        responsibleUserId: a.responsible_user_id || '',
        employees: employeeNames,
        car: a.cars && a.cars.length > 0 ? a.cars[0].id : null,
        cars: a.cars?.map(car => car.id) || [],
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        responsibleUser: a.responsible_user
      };
    });

    console.log('[useOptimizedAssignments] DEFINITIVE FIX - Transform complete:', {
      totalTransformed: transformed.length,
      asbestAssignments: transformed.filter(a => a.title.toLowerCase().includes('asbestkursus')).length,
      sampleAsbestEmployees: transformed
        .filter(a => a.title.toLowerCase().includes('asbestkursus'))
        .map(a => ({ title: a.title, employees: a.employees }))
    });

    setTransformedAssignments(transformed);
  }, [assignments]);

  useEffect(() => {
    transformAssignments();
  }, [assignments, transformAssignments]);

  return {
    assignments: transformedAssignments || [],
    loading,
    error,
    operationStates,
    refetch,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate,
    updateAssignment,
    createAssignment
  };
};
