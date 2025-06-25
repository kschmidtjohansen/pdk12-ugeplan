import { useState, useEffect, useCallback, useMemo } from 'react';
import { Assignment } from '@/types/assignment';
import { AssignmentFilterService } from '@/services/assignmentFilterService';
import { OptimizedAssignmentService, OptimizedAssignmentData } from '@/services/optimizedAssignmentService';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { publishAssignmentHandler } from '@/utils/assignmentPublishing';

export const useOptimizedAssignments = (filter: string = 'all') => {
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
      
      setAssignments(fetchedAssignments);
      setError(null);
    } catch (err: any) {
      setError(err);
      toast({
        title: t('common.error'),
        description: t('planner.fetchError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [filter, userId, userRole, t, toast]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const deleteAssignment = useCallback(async (id: string) => {
    setOperationStates(prevState => ({ ...prevState, [id]: 'loading' }));
    try {
      // Optimistically update the UI
      setTransformedAssignments(prevAssignments => {
        if (!prevAssignments) return prevAssignments;
        return prevAssignments.filter(assignment => assignment.id !== id);
      });
      
      // Delete the assignment from the database
      // const { error } = await supabase.from('assignments').delete().eq('id', id);
      
      // Simulate successful deletion
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
      // Revert the UI on error
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
        [id] // Pass the assignment ID to be published
      );
      
      if (success) {
        toast({
          title: t('common.success'),
          description: t('planner.publishSuccess'),
        });
        setOperationStates(prevState => ({ ...prevState, [id]: 'success' }));
        
        // Trigger a refetch to get updated data
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
        null, // assignmentIds - null to use date filter
        date // Pass the date parameter
      );
      
      if (success) {
        // Trigger a refetch to get updated data
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
        // Optimistically update the UI
        setTransformedAssignments(prevAssignments => {
          if (!prevAssignments) return prevAssignments;
          return prevAssignments.map(assignment =>
            assignment.id === id ? { ...assignment, ...updates } : assignment
          );
        });
  
        // Update the assignment in the database
        // const { error } = await supabase
        //   .from('assignments')
        //   .update(updates)
        //   .eq('id', id);
  
        // Simulate successful update
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
        // Revert the UI on error
        refetch();
      }
    },
    [refetch, t, toast]
  );

  const createAssignment = useCallback(
    async (newAssignment: Omit<Assignment, 'id'>) => {
      setOperationStates(prevState => ({ ...prevState, 'create': 'loading' }));
      try {
        // Simulate creating assignment in the database
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
        // Refresh assignments
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

    const transformed = assignments.map(a => ({
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
      employees: a.employees || [],
      car: a.cars && a.cars.length > 0 ? a.cars[0] : null,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      responsibleUser: a.responsible_user
    }));

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
