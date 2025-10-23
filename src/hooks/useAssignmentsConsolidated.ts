
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { useOptimizedAssignments, AssignmentFilter } from './useOptimizedAssignments';

interface UseAssignmentsConsolidatedProps {
  filter?: 'all' | 'dashboard' | 'planner';
  includeUnpublished?: boolean;
}

export const useAssignmentsConsolidated = ({ 
  filter = 'all', 
  includeUnpublished = true 
}: UseAssignmentsConsolidatedProps = {}) => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  
  const { toast } = useToast();
  const { t } = useTranslation();
  const { canPublishTasks } = usePermissions();

  // Map filter types to match useOptimizedAssignments expected types
  const getOptimizedFilter = (filter: 'all' | 'dashboard' | 'planner', includeUnpublished: boolean): AssignmentFilter => {
    console.log('[useAssignmentsConsolidated] getOptimizedFilter called with:', { filter, includeUnpublished });
    
    // If includeUnpublished is false, force 'published' filter regardless of filter type
    if (!includeUnpublished) {
      console.log('[useAssignmentsConsolidated] includeUnpublished is false, returning "published"');
      return 'published';
    }
    
    console.log('[useAssignmentsConsolidated] includeUnpublished is true, processing filter type:', filter);
    switch (filter) {
      case 'dashboard':
        return 'user';
      case 'planner':
        return 'all';
      default:
        return 'all';
    }
  };

  const optimizedFilter = getOptimizedFilter(filter, includeUnpublished);
  console.log('[useAssignmentsConsolidated] Final optimized filter:', optimizedFilter);

  // Use optimized assignment service directly
  const optimizedHook = useOptimizedAssignments(optimizedFilter);

  // Set operation state for individual operations
  const setOperationState = useCallback((assignmentId: string, state: 'publishing' | 'deleting' | 'updating' | null) => {
    // This is handled internally by useOptimizedAssignments now
    console.log(`[useAssignmentsConsolidated] Operation state for ${assignmentId}: ${state}`);
  }, []);

  return {
    assignments: optimizedHook.assignments,
    loading: optimizedHook.loading,
    error: optimizedHook.error,
    operationStates: optimizedHook.operationStates,
    fetchAssignments: optimizedHook.refetch,
    setAssignments: () => {}, // Not needed with optimized hook
    createAssignment: optimizedHook.createAssignment,
    updateAssignment: optimizedHook.updateAssignment,
    deleteAssignment: optimizedHook.deleteAssignment,
    publishAssignment: optimizedHook.publishAssignment,
    publishAssignmentsByDate: optimizedHook.publishAssignmentsByDate,
    isDialogOpen,
    setIsDialogOpen,
    setOperationState
  };
};
