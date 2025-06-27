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
      
      console.log('[useOptimizedAssignments] PHASE 2 DEBUG - Fetching with filter:', filter, 'for user:', user?.name, 'role:', userRole);
      
      if (filter === 'user' && userId) {
        // PHASE 2 DEBUG: Dashboard context - get ALL user assignments with colleague names
        console.log('[useOptimizedAssignments] PHASE 2 DEBUG - Dashboard: Fetching ALL user assignments with colleague names');
        fetchedAssignments = await OptimizedAssignmentService.fetchUserAssignments(userId, userRole);
      } else if (filter === 'published') {
        // PHASE 2 DEBUG: Planner context - get ALL published assignments
        console.log('[useOptimizedAssignments] PHASE 2 DEBUG - Planner: Fetching ALL published assignments');
        fetchedAssignments = await OptimizedAssignmentService.fetchPublishedAssignments(userId, userRole);
      } else if (filter === 'all') {
        // PHASE 2 DEBUG: Admin/Skadeleder context - get ALL assignments
        console.log('[useOptimizedAssignments] PHASE 2 DEBUG - Admin: Fetching ALL assignments');
        fetchedAssignments = await OptimizedAssignmentService.fetchAllAssignments(userRole);
      } else if (filter === 'unpublished') {
        // PHASE 2 DEBUG: Admin/Skadeleder context - get unpublished assignments
        fetchedAssignments = await OptimizedAssignmentService.fetchUnpublishedAssignments(userId, userRole);
      } else {
        fetchedAssignments = await OptimizedAssignmentService.fetchAllAssignments(userRole);
      }
      
      console.log('[useOptimizedAssignments] PHASE 2 DEBUG - Fetched assignments:', fetchedAssignments.length);
      
      // PHASE 2 DEBUG: Detailed logging for debugging
      console.log('[useOptimizedAssignments] PHASE 2 DEBUG - Assignment breakdown by filter:', {
        filter,
        userRole,
        totalAssignments: fetchedAssignments.length,
        assignmentsWithEmployees: fetchedAssignments.filter(a => a.employees.length > 0).length,
        totalEmployeeNamesVisible: fetchedAssignments.reduce((sum, a) => sum + a.employees.length, 0),
        asbestkursusAssignments: fetchedAssignments.filter(a => a.title.toLowerCase().includes('asbestkursus')).map(a => ({
          title: a.title,
          employees: a.employees.map(e => e.name),
          date: a.assignment_date
        }))
      });
      
      setAssignments(fetchedAssignments);
      setError(null);
    } catch (err: any) {
      console.error('[useOptimizedAssignments] PHASE 2 DEBUG - Fetch error:', err);
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

    console.log('[useOptimizedAssignments] PHASE 2 DEBUG - Transforming assignments:', assignments.length);

    const transformed: Assignment[] = assignments.map(a => {
      const employeeNames = Array.isArray(a.employees) 
        ? a.employees.map(emp => emp.name).filter(name => name && name.trim() !== '')
        : [];
      
      // PHASE 2 DEBUG: Special attention to Asbestkursus
      if (a.title.toLowerCase().includes('asbestkursus')) {
        console.log(`[useOptimizedAssignments] PHASE 2 DEBUG - 🎯 ASBESTKURSUS TRANSFORMATION:`, {
          title: a.title,
          rawEmployees: a.employees,
          transformedEmployeeNames: employeeNames,
          expectedNames: ['Mark Hansen', 'Julie Mortensen']
        });
      }
      
      // CAR FIX: Properly handle car data from the service
      const carIds = a.cars?.map(car => car.id) || [];
      const primaryCar = a.cars && a.cars.length > 0 ? a.cars[0].id : null;

      if (a.cars && a.cars.length > 0) {
        console.log(`[useOptimizedAssignments] PHASE 2 DEBUG - 🚗 Assignment with cars:`, {
          title: a.title,
          date: a.assignment_date,
          carCount: a.cars.length,
          carNames: a.cars.map(c => c.name),
          carIds: carIds
        });
      }

      console.log(`[useOptimizedAssignments] PHASE 2 DEBUG - Transformed assignment "${a.title}" with employees:`, employeeNames);

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
        car: primaryCar,
        cars: carIds,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        responsibleUser: a.responsible_user
      };
    });

    console.log('[useOptimizedAssignments] PHASE 2 DEBUG - Transform complete:', {
      totalTransformed: transformed.length,
      assignmentsWithEmployees: transformed.filter(a => a.employees && a.employees.length > 0).length,
      totalEmployeeNamesVisible: transformed.reduce((sum, a) => sum + (a.employees?.length || 0), 0),
      asbestkursusTransformed: transformed.filter(a => a.title.toLowerCase().includes('asbestkursus')).map(a => ({
        title: a.title,
        employees: a.employees
      }))
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
