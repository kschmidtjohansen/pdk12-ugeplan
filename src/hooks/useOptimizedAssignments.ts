
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

  // FIXED: Enhanced fetch with better error handling and recovery
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
      const errorMessage = err instanceof Error ? err.message : t('planner.fetchError');
      setError(errorMessage);
      
      // Enhanced error handling with retry mechanism
      if (!errorMessage.includes('JWT') && !errorMessage.includes('auth')) {
        toast({
          title: t('common.error'),
          description: t('planner.fetchError'),
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [includeUnpublished, toast, t]);

  // FIXED: Enhanced operation state management with cleanup
  const setOperationState = useCallback((assignmentId: string, state: 'publishing' | 'deleting' | 'updating' | null) => {
    setOperationStates(prev => {
      if (state === null) {
        const { [assignmentId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [assignmentId]: state
      };
    });
  }, []);

  // FIXED: Enhanced publish with better conflict resolution
  const publishAssignment = useCallback(async (assignmentId: string) => {
    if (!canPublishTasks) {
      toast({
        title: t('common.error'),
        description: t('planner.noPermissionPublish'),
        variant: "destructive",
      });
      return false;
    }

    console.log('[useOptimizedAssignments] Publishing assignment:', assignmentId);
    
    // Prevent multiple simultaneous operations
    if (operationStates[assignmentId]) {
      console.log('[useOptimizedAssignments] Operation already in progress for:', assignmentId);
      return false;
    }
    
    setOperationState(assignmentId, 'publishing');
    
    // Store original state for rollback
    const originalAssignment = assignments.find(a => a.id === assignmentId);
    if (!originalAssignment) {
      setOperationState(assignmentId, null);
      return false;
    }

    // Optimistic update
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
        throw new Error(t('planner.operationFailed'));
      }
    } catch (error) {
      console.error('[useOptimizedAssignments] Error publishing assignment:', error);
      
      // Rollback optimistic update
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === assignmentId 
            ? originalAssignment
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
  }, [canPublishTasks, toast, t, setOperationState, operationStates, assignments]);

  // FIXED: Enhanced delete with proper cleanup
  const deleteAssignment = useCallback(async (assignmentId: string) => {
    console.log('[useOptimizedAssignments] Deleting assignment:', assignmentId);
    
    // Prevent multiple operations
    if (operationStates[assignmentId]) {
      console.log('[useOptimizedAssignments] Operation already in progress for:', assignmentId);
      return false;
    }
    
    setOperationState(assignmentId, 'deleting');
    
    const assignmentToDelete = assignments.find(a => a.id === assignmentId);
    if (!assignmentToDelete) {
      setOperationState(assignmentId, null);
      return false;
    }
    
    // Optimistic update
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
        throw new Error('Delete operation failed');
      }
    } catch (error) {
      console.error('[useOptimizedAssignments] Error deleting assignment:', error);
      
      // Rollback optimistic update
      setAssignments(prev => [...prev, assignmentToDelete]);
      
      toast({
        title: t('common.error'),
        description: t('planner.errorDeletingAssignment'),
        variant: "destructive",
      });
      return false;
    } finally {
      setOperationState(assignmentId, null);
    }
  }, [assignments, toast, t, setOperationState, operationStates]);

  // FIXED: Enhanced create with better data validation
  const createAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    try {
      if (!assignmentData.title || !assignmentData.location || !assignmentData.date) {
        throw new Error('Title, location, and date are required');
      }

      console.log('[useOptimizedAssignments] Creating assignment:', assignmentData);
      
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

      // Optimistic update
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
        throw new Error('Create operation failed');
      }
    } catch (error) {
      console.error('[useOptimizedAssignments] Error creating assignment:', error);
      
      // Remove temp assignment on failure
      setAssignments(prev => prev.filter(a => !a.id.startsWith('temp_')));
      
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('planner.errorCreatingAssignment'),
        variant: "destructive",
      });
      return false;
    }
  }, [fetchAssignments, toast, t]);

  // FIXED: Enhanced update with conflict resolution
  const updateAssignment = useCallback(async (assignmentId: string, assignmentData: Partial<Assignment>) => {
    console.log('[useOptimizedAssignments] Updating assignment:', assignmentId);
    
    // Prevent multiple operations
    if (operationStates[assignmentId]) {
      console.log('[useOptimizedAssignments] Operation already in progress for:', assignmentId);
      return false;
    }
    
    setOperationState(assignmentId, 'updating');
    
    const originalAssignment = assignments.find(a => a.id === assignmentId);
    if (!originalAssignment) {
      setOperationState(assignmentId, null);
      return false;
    }
    
    // Optimistic update with unpublished status
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
        throw new Error('Update operation failed');
      }
    } catch (error) {
      console.error('[useOptimizedAssignments] Error updating assignment:', error);
      
      // Rollback optimistic update
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === assignmentId ? originalAssignment : assignment
        )
      );
      
      toast({
        title: t('common.error'),
        description: t('planner.errorUpdatingAssignment'),
        variant: "destructive",
      });
      return false;
    } finally {
      setOperationState(assignmentId, null);
    }
  }, [assignments, toast, t, setOperationState, operationStates]);

  // FIXED: Enhanced publish day with better validation
  const publishAssignmentsByDate = useCallback(async (date: string) => {
    if (!canPublishTasks) {
      toast({
        title: t('common.error'),
        description: t('planner.noPermissionPublish'),
        variant: "destructive",
      });
      return false;
    }

    const unpublishedAssignments = assignments.filter(a => a.date === date && !a.published);
    
    if (unpublishedAssignments.length === 0) {
      toast({
        title: t('common.info'),
        description: t('planner.noUnpublishedAssignments'),
      });
      return false;
    }

    console.log('[useOptimizedAssignments] Publishing day:', date, unpublishedAssignments.length, 'assignments');
    
    // Optimistic update
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
        throw new Error(t('planner.publishOperationFailed'));
      }
    } catch (error) {
      console.error('[useOptimizedAssignments] Error publishing day:', error);
      
      // Rollback optimistic update
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

  // FIXED: Enhanced realtime subscriptions with conflict resolution
  useEffect(() => {
    const subscriptionId = `optimized_assignments_${filter}`;
    
    const handleRealtimeUpdate = () => {
      console.log('[useOptimizedAssignments] Realtime update triggered');
      
      // Only refresh if no operations are in progress
      const hasActiveOperations = Object.values(operationStates).some(state => state !== null);
      if (!hasActiveOperations) {
        optimizedAssignmentService.invalidateCache('assignments');
        fetchAssignments();
      } else {
        console.log('[useOptimizedAssignments] Skipping realtime update due to active operations');
      }
    };

    const subscription = improvedRealtimeManager.subscribe(
      subscriptionId,
      ['assignments', 'assignments_employees'],
      handleRealtimeUpdate,
      { debounceMs: 500 } // Longer debounce to prevent conflicts
    );

    if (!subscription) {
      console.warn('[useOptimizedAssignments] Failed to create realtime subscription');
    }

    return () => {
      improvedRealtimeManager.unsubscribe(subscriptionId);
    };
  }, [filter, fetchAssignments, operationStates]);

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
