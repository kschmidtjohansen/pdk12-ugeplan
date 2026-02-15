
import { useState, useCallback } from 'react';
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

  // Map filter types to match useOptimizedAssignments expected types
  const getOptimizedFilter = (filter: 'all' | 'dashboard' | 'planner', includeUnpublished: boolean): AssignmentFilter => {
    if (!includeUnpublished) {
      return 'published';
    }
    
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

  // Use optimized assignment service directly
  const optimizedHook = useOptimizedAssignments(optimizedFilter);

  // Set operation state for individual operations
  const setOperationState = useCallback((assignmentId: string, state: 'publishing' | 'deleting' | 'updating' | null) => {
    // This is handled internally by useOptimizedAssignments now
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
