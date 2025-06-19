
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { optimizedAssignmentService } from '@/services/optimizedAssignmentService';
import { improvedRealtimeManager } from '@/services/improvedRealtimeManager';

interface UseOptimizedAssignmentsProps {
  filter?: 'all' | 'dashboard' | 'planner';
  includeUnpublished?: boolean;
}

export const useOptimizedAssignments = ({ 
  filter = 'all', 
  includeUnpublished = true 
}: UseOptimizedAssignmentsProps = {}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [operationStates, setOperationStates] = useState<Record<string, 'publishing' | 'deleting' | 'updating' | null>>({});
  
  const { toast } = useToast();
  const { t } = useTranslation();
  const { canPublishTasks } = usePermissions();

  // Optimized fetch with better error handling
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useOptimizedAssignments] Fetching assignments...');
      const optimizedData = await optimizedAssignmentService.fetchAssignmentsOptimized(includeUnpublished);
      
      setAssignments(optimizedData.assignments);
      console.log('[useOptimizedAssignments] Loaded', optimizedData.assignments.length, 'assignments');
    } catch (err) {
      console.error('[useOptimizedAssignments] Error fetching assignments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignments';
      setError(errorMessage);
      
      if (!errorMessage.includes('JWT') && !errorMessage.includes('auth')) {
        toast({
          title: t('common.error'),
          description: t('planner.fetchError'),
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [includeUnpublished, toast, t]);

  // Set operation state for individual assignments
  const setOperationState = useCallback((assignmentId: string, state: 'publishing' | 'deleting' | 'updating' | null) => {
    setOperationStates(prev => ({
      ...prev,
      [assignmentId]: state
    }));
  }, []);

  // Optimistic publish with immediate UI feedback
  const publishAssignment = useCallback(async (assignmentId: string) => {
    if (!canPublishTasks) {
      toast({
        title: t('common.error'),
        description: 'You do not have permission to publish assignments.',
        variant: "destructive",
      });
      return false;
    }

    console.log('[useOptimizedAssignments] Publishing assignment optimistically:', assignmentId);
    
    // Set loading state immediately
    setOperationState(assignmentId, 'publishing');
    
    // Optimistic update - update UI immediately
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, published: true }
          : assignment
      )
    );

    try {
      const success = await optimizedAssignmentService.publishAssignmentOptimistic(assignmentId);
      
      if (success) {
        toast({
          title: t('planner.assignmentPublished'),
          description: t('planner.assignmentPublishedMsg'),
        });
        return true;
      } else {
        // Revert optimistic update on failure
        setAssignments(prev => 
          prev.map(assignment => 
            assignment.id === assignmentId 
              ? { ...assignment, published: false }
              : assignment
          )
        );
        throw new Error('Publish operation failed');
      }
    } catch (error) {
      console.error('[useOptimizedAssignments] Error publishing assignment:', error);
      
      // Revert optimistic update
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, published: false }
            : assignment
        )
      );
      
      toast({
        title: t('common.error'),
        description: t('planner.errorPublishingAssignment'),
        variant: "destructive",
      });
      return false;
    } finally {
      setOperationState(assignmentId, null);
    }
  }, [canPublishTasks, toast, t, setOperationState]);

  // Optimistic delete with immediate UI feedback
  const deleteAssignment = useCallback(async (assignmentId: string) => {
    console.log('[useOptimizedAssignments] Deleting assignment optimistically:', assignmentId);
    
    // Set loading state immediately
    setOperationState(assignmentId, 'deleting');
    
    // Store assignment for potential revert
    const assignmentToDelete = assignments.find(a => a.id === assignmentId);
    
    // Optimistic update - remove from UI immediately
    setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));

    try {
      const success = await optimizedAssignmentService.deleteAssignmentOptimistic(assignmentId);
      
      if (success) {
        toast({
          title: t('planner.assignmentDeleted'),
          description: t('planner.assignmentDeletedMsg'),
        });
        return true;
      } else {
        // Revert optimistic update on failure
        if (assignmentToDelete) {
          setAssignments(prev => [...prev, assignmentToDelete]);
        }
        throw new Error('Delete operation failed');
      }
    } catch (error) {
      console.error('[useOptimizedAssignments] Error deleting assignment:', error);
      
      // Revert optimistic update
      if (assignmentToDelete) {
        setAssignments(prev => [...prev, assignmentToDelete]);
      }
      
      toast({
        title: t('common.error'),
        description: t('planner.errorDeletingAssignment'),
        variant: "destructive",
      });
      return false;
    } finally {
      setOperationState(assignmentId, null);
    }
  }, [assignments, toast, t, setOperationState]);

  // Create assignment with optimistic updates
  const createAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    try {
      if (!assignmentData.title || !assignmentData.location || !assignmentData.date) {
        throw new Error('Title, location, and date are required');
      }

      console.log('[useOptimizedAssignments] Creating assignment optimistically:', assignmentData);
      
      // Create temporary assignment for optimistic update
      const tempId = `temp_${Date.now()}`;
      const tempAssignment: Assignment = {
        id: tempId,
        title: assignmentData.title,
        description: assignmentData.description || '',
        date: assignmentData.date,
        fromTime: assignmentData.fromTime || '08:00',
        toTime: assignmentData.toTime || '16:00',
        location: assignmentData.location,
        car: assignmentData.car || null,
        cars: assignmentData.cars || [],
        employees: assignmentData.employees || [],
        published: false,
        responsibleUser: assignmentData.responsibleUser || null
      };

      // Optimistic update - add to UI immediately
      setAssignments(prev => [...prev, tempAssignment]);

      const success = await optimizedAssignmentService.createAssignmentOptimistic(assignmentData);
      
      if (success) {
        // Remove temp assignment and refresh to get real data
        setAssignments(prev => prev.filter(a => a.id !== tempId));
        await fetchAssignments();
        
        toast({
          title: t('planner.assignmentCreated'),
          description: t('planner.assignmentCreatedMsg'),
        });
        return true;
      } else {
        // Remove temp assignment on failure
        setAssignments(prev => prev.filter(a => a.id !== tempId));
        throw new Error('Create operation failed');
      }
    } catch (error) {
      console.error('[useOptimizedAssignments] Error creating assignment:', error);
      
      toast({
        title: t('common.error'),
        description: t('planner.errorCreatingAssignment'),
        variant: "destructive",
      });
      return false;
    }
  }, [fetchAssignments, toast, t]);

  // Update assignment with optimistic updates
  const updateAssignment = useCallback(async (assignmentId: string, assignmentData: Partial<Assignment>) => {
    console.log('[useOptimizedAssignments] Updating assignment optimistically:', assignmentId);
    
    // Set loading state immediately
    setOperationState(assignmentId, 'updating');
    
    // Store original for potential revert
    const originalAssignment = assignments.find(a => a.id === assignmentId);
    
    // Optimistic update - update UI immediately with unpublished status
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, ...assignmentData, published: false }
          : assignment
      )
    );

    try {
      const success = await optimizedAssignmentService.updateAssignmentOptimistic(assignmentId, assignmentData);
      
      if (success) {
        toast({
          title: t('planner.assignmentUpdated'),
          description: t('planner.assignmentUpdatedMsg'),
        });
        return true;
      } else {
        // Revert optimistic update on failure
        if (originalAssignment) {
          setAssignments(prev => 
            prev.map(assignment => 
              assignment.id === assignmentId ? originalAssignment : assignment
            )
          );
        }
        throw new Error('Update operation failed');
      }
    } catch (error) {
      console.error('[useOptimizedAssignments] Error updating assignment:', error);
      
      // Revert optimistic update
      if (originalAssignment) {
        setAssignments(prev => 
          prev.map(assignment => 
            assignment.id === assignmentId ? originalAssignment : assignment
          )
        );
      }
      
      toast({
        title: t('common.error'),
        description: t('planner.errorUpdatingAssignment'),
        variant: "destructive",
      });
      return false;
    } finally {
      setOperationState(assignmentId, null);
    }
  }, [assignments, toast, t, setOperationState]);

  // Publish assignments by date
  const publishAssignmentsByDate = useCallback(async (date: string) => {
    if (!canPublishTasks) {
      toast({
        title: t('common.error'),
        description: 'You do not have permission to publish assignments.',
        variant: "destructive",
      });
      return false;
    }

    const unpublishedAssignments = assignments.filter(a => a.date === date && !a.published);
    
    if (unpublishedAssignments.length === 0) {
      toast({
        title: t('common.info'),
        description: 'No unpublished assignments found for this date.',
      });
      return false;
    }

    console.log('[useOptimizedAssignments] Publishing day optimistically:', date);
    
    // Optimistic update - publish all assignments for the date
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.date === date 
          ? { ...assignment, published: true }
          : assignment
      )
    );

    try {
      const success = await optimizedAssignmentService.publishAssignmentsByDateOptimistic(date);
      
      if (success) {
        toast({
          title: t('planner.dayPublished'),
          description: t('planner.dayPublishedMsg'),
        });
        return true;
      } else {
        throw new Error('Some assignments failed to publish');
      }
    } catch (error) {
      console.error('[useOptimizedAssignments] Error publishing day:', error);
      
      // Revert optimistic update
      setAssignments(prev => 
        prev.map(assignment => 
          unpublishedAssignments.some(ua => ua.id === assignment.id)
            ? { ...assignment, published: false }
            : assignment
        )
      );
      
      toast({
        title: t('common.error'),
        description: t('planner.errorPublishingDay'),
        variant: "destructive",
      });
      return false;
    }
  }, [assignments, canPublishTasks, toast, t]);

  // Initial load
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Optimized realtime subscriptions with faster debounce
  useEffect(() => {
    const subscriptionId = `optimized_assignments_${filter}`;
    
    const handleRealtimeUpdate = () => {
      console.log('[useOptimizedAssignments] Realtime update triggered');
      // Use selective cache invalidation
      optimizedAssignmentService.invalidateCache('assignments');
      fetchAssignments();
    };

    const subscription = improvedRealtimeManager.subscribe(
      subscriptionId,
      ['assignments', 'assignments_employees'],
      handleRealtimeUpdate,
      { debounceMs: 200 } // Faster response time
    );

    if (!subscription) {
      console.warn('[useOptimizedAssignments] Failed to create realtime subscription');
    }

    return () => {
      improvedRealtimeManager.unsubscribe(subscriptionId);
    };
  }, [filter, fetchAssignments]);

  return {
    assignments,
    loading,
    error,
    operationStates,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    publishAssignment,
    deleteAssignment,
    publishAssignmentsByDate
  };
};
