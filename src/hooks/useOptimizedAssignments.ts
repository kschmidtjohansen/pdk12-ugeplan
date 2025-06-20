
import { useState, useEffect, useCallback } from 'react';
import { Assignment } from '@/types/assignment';
import { optimizedAssignmentService } from '@/services/optimizedAssignmentService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';

export interface UseOptimizedAssignmentsOptions {
  filter?: 'all' | 'user' | 'published';
  includeUnpublished?: boolean;
}

export interface OperationStates {
  [assignmentId: string]: 'publishing' | 'deleting' | 'updating' | null;
}

export const useOptimizedAssignments = (options: UseOptimizedAssignmentsOptions = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const { filter = 'all', includeUnpublished = false } = options;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationStates, setOperationStates] = useState<OperationStates>({});

  console.log(`[useOptimizedAssignments] CRITICAL FIX - Hook called with filter: ${filter}, includeUnpublished: ${includeUnpublished}, user: ${user?.name} (${user?.role})`);

  // Fetch assignments with proper filtering
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[useOptimizedAssignments] CRITICAL FIX - Fetching assignments for ${user?.role} with includeUnpublished: ${includeUnpublished}`);
      
      const { assignments: fetchedAssignments } = await optimizedAssignmentService.fetchAssignmentsOptimized(includeUnpublished);
      
      console.log(`[useOptimizedAssignments] CRITICAL FIX - Fetched ${fetchedAssignments.length} raw assignments`);
      fetchedAssignments.forEach(assignment => {
        console.log(`[useOptimizedAssignments] Raw assignment: ${assignment.id} - ${assignment.title} - Employees: [${assignment.employees?.join(', ')}] - Published: ${assignment.published}`);
      });

      // Apply filtering based on context
      let filteredAssignments = fetchedAssignments;

      switch (filter) {
        case 'published':
          filteredAssignments = fetchedAssignments.filter(a => a.published);
          console.log(`[useOptimizedAssignments] CRITICAL FIX - Published filter: ${filteredAssignments.length} assignments`);
          break;
          
        case 'user':
          // CRITICAL FIX: For dashboard context - filter to user's assignments but preserve ALL employee data
          if (user?.name) {
            filteredAssignments = fetchedAssignments.filter(assignment => {
              const isResponsible = assignment.responsibleUser && assignment.responsibleUser.id === user.id;
              const isAssigned = assignment.employees && Array.isArray(assignment.employees) && assignment.employees.includes(user.name);
              const shouldShow = (isResponsible || isAssigned) && assignment.published;
              
              if (shouldShow) {
                console.log(`[useOptimizedAssignments] CRITICAL FIX - Dashboard: User ${user.name} gets assignment ${assignment.title} with ALL employees: [${assignment.employees?.join(', ')}]`);
              }
              
              return shouldShow;
            });
          }
          console.log(`[useOptimizedAssignments] CRITICAL FIX - User filter (dashboard): ${filteredAssignments.length} assignments for ${user?.name}`);
          break;
          
        case 'all':
        default:
          // CRITICAL FIX: For planner context - show ALL assignments based on user role
          if (user?.role === 'servicemedarbejder') {
            // CRITICAL FIX: Servicemedarbejder sees ALL published assignments in planner
            filteredAssignments = fetchedAssignments.filter(a => a.published);
            console.log(`[useOptimizedAssignments] CRITICAL FIX - Planner: Servicemedarbejder ${user.name} sees ALL ${filteredAssignments.length} published assignments`);
          } else {
            // Admin/Skadeleder see all assignments (published + unpublished if allowed)
            filteredAssignments = fetchedAssignments.filter(a => includeUnpublished || a.published);
            console.log(`[useOptimizedAssignments] CRITICAL FIX - Planner: Admin/Skadeleder sees ${filteredAssignments.length} assignments`);
          }
          break;
      }

      console.log(`[useOptimizedAssignments] CRITICAL FIX - Final filtered assignments: ${filteredAssignments.length}`);
      filteredAssignments.forEach(assignment => {
        console.log(`[useOptimizedAssignments] Final assignment: ${assignment.id} - ${assignment.title} - Employees: [${assignment.employees?.join(', ')}] - Published: ${assignment.published}`);
      });

      setAssignments(filteredAssignments);
    } catch (err) {
      console.error('[useOptimizedAssignments] Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('common.fetchError')
      });
    } finally {
      setLoading(false);
    }
  }, [filter, includeUnpublished, user, toast, t]);

  // Load assignments on mount and when dependencies change
  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [fetchAssignments, user]);

  // Set operation state for UI feedback
  const setOperationState = useCallback((assignmentId: string, state: 'publishing' | 'deleting' | 'updating' | null) => {
    setOperationStates(prev => ({ ...prev, [assignmentId]: state }));
  }, []);

  // Create assignment with optimistic updates
  const createAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    console.log('[useOptimizedAssignments] Creating assignment:', assignmentData);
    
    try {
      const success = await optimizedAssignmentService.createAssignmentOptimistic(assignmentData);
      if (success) {
        await fetchAssignments(); // Refresh data
        toast({
          title: t('planner.assignmentCreated'),
          description: t('planner.assignmentCreatedDescription')
        });
      }
      return success;
    } catch (error) {
      console.error('[useOptimizedAssignments] Error creating assignment:', error);
      toast({
        variant: "destructive", 
        title: t('common.error'),
        description: t('planner.createError')
      });
      return false;
    }
  }, [fetchAssignments, toast, t]);

  // Update assignment with optimistic updates
  const updateAssignment = useCallback(async (assignmentId: string, assignmentData: Partial<Assignment>) => {
    console.log('[useOptimizedAssignments] Updating assignment:', assignmentId);
    
    setOperationState(assignmentId, 'updating');
    
    try {
      const success = await optimizedAssignmentService.updateAssignmentOptimistic(assignmentId, assignmentData);
      if (success) {
        await fetchAssignments(); // Refresh data
        toast({
          title: t('planner.assignmentUpdated'),
          description: t('planner.assignmentUpdatedDescription')
        });
      }
      return success;
    } catch (error) {
      console.error('[useOptimizedAssignments] Error updating assignment:', error);
      toast({
        variant: "destructive",
        title: t('common.error'), 
        description: t('planner.updateError')
      });
      return false;
    } finally {
      setOperationState(assignmentId, null);
    }
  }, [fetchAssignments, setOperationState, toast, t]);

  // Delete assignment with optimistic updates
  const deleteAssignment = useCallback(async (assignmentId: string) => {
    console.log('[useOptimizedAssignments] Deleting assignment:', assignmentId);
    
    setOperationState(assignmentId, 'deleting');
    
    try {
      const success = await optimizedAssignmentService.deleteAssignmentOptimistic(assignmentId);
      if (success) {
        await fetchAssignments(); // Refresh data
        toast({
          title: t('planner.assignmentDeleted'),
          description: t('planner.assignmentDeletedDescription')
        });
      }
      return success;
    } catch (error) {
      console.error('[useOptimizedAssignments] Error deleting assignment:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('planner.deleteError')
      });
      return false;
    } finally {
      setOperationState(assignmentId, null);
    }
  }, [fetchAssignments, setOperationState, toast, t]);

  // Publish assignment with optimistic updates
  const publishAssignment = useCallback(async (assignmentId: string) => {
    console.log('[useOptimizedAssignments] Publishing assignment:', assignmentId);
    
    setOperationState(assignmentId, 'publishing');
    
    try {
      const success = await optimizedAssignmentService.publishAssignmentOptimistic(assignmentId);
      if (success) {
        await fetchAssignments(); // Refresh data
        toast({
          title: t('planner.assignmentPublished'),
          description: t('planner.assignmentPublishedDescription')
        });
      }
      return success;
    } catch (error) {
      console.error('[useOptimizedAssignments] Error publishing assignment:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('planner.publishError')
      });
      return false;
    } finally {
      setOperationState(assignmentId, null);
    }
  }, [fetchAssignments, setOperationState, toast, t]);

  // Publish assignments by date with optimistic updates
  const publishAssignmentsByDate = useCallback(async (date: string) => {
    console.log('[useOptimizedAssignments] Publishing assignments by date:', date);
    
    try {
      const success = await optimizedAssignmentService.publishAssignmentsByDateOptimistic(date);
      if (success) {
        await fetchAssignments(); // Refresh data
        toast({
          title: t('planner.dayPublished'),
          description: t('planner.dayPublishedDescription')
        });
      }
      return success;
    } catch (error) {
      console.error('[useOptimizedAssignments] Error publishing assignments by date:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('planner.publishDayError')
      });
      return false;
    }
  }, [fetchAssignments, toast, t]);

  return {
    assignments,
    loading,
    error,
    operationStates,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate,
    refetch: fetchAssignments
  };
};
