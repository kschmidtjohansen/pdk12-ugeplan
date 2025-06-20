
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from './useEmployees';
import { useVacations } from './useVacations';
import { cleanupAssignmentEmployees } from '@/utils/employeeAssignmentUtils';
import { useErrorRecovery } from './useErrorRecovery';
import { dataFetchingService } from '@/services/dataFetchingService';
import { realtimeManager } from '@/services/realtimeManager';
import { useCarDataHandler } from './assignment/useCarDataHandler';
import { useOptimizedAssignments } from './useOptimizedAssignments';

interface UseAssignmentsConsolidatedProps {
  filter?: 'all' | 'dashboard' | 'planner';
  includeUnpublished?: boolean;
}

export const useAssignmentsConsolidated = ({ 
  filter = 'all', 
  includeUnpublished = true 
}: UseAssignmentsConsolidatedProps = {}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [operationStates, setOperationStates] = useState<Record<string, 'publishing' | 'deleting' | 'updating' | null>>({});
  
  const { toast } = useToast();
  const { t } = useTranslation();
  const { canPublishTasks } = usePermissions();
  const { employees } = useEmployees();
  const { vacations } = useVacations();
  const { executeWithRecovery } = useErrorRecovery();
  const { transformCarForDatabase } = useCarDataHandler();

  // Map filter types to match useOptimizedAssignments expected types
  const getOptimizedFilter = (filter: 'all' | 'dashboard' | 'planner'): 'all' | 'user' | 'published' => {
    switch (filter) {
      case 'dashboard':
        return 'user';
      case 'planner':
        return 'all';
      default:
        return 'all';
    }
  };

  // Use optimized assignment service
  const { 
    assignments: optimizedAssignments, 
    loading: optimizedLoading,
    error: optimizedError,
    operationStates: optimizedOperationStates,
    refetch: optimizedRefetch,
    publishAssignment: optimizedPublishAssignment,
    deleteAssignment: optimizedDeleteAssignment,
    publishAssignmentsByDate: optimizedPublishAssignmentsByDate,
    createAssignment: optimizedCreateAssignment,
    updateAssignment: optimizedUpdateAssignment
  } = useOptimizedAssignments(getOptimizedFilter(filter));

  // Sync optimized data with local state
  useEffect(() => {
    setAssignments(optimizedAssignments);
    setLoading(optimizedLoading);
    setError(optimizedError);
    setOperationStates(optimizedOperationStates);
  }, [optimizedAssignments, optimizedLoading, optimizedError, optimizedOperationStates]);

  // Set operation state for individual operations
  const setOperationState = useCallback((assignmentId: string, state: 'publishing' | 'deleting' | 'updating' | null) => {
    setOperationStates(prev => ({
      ...prev,
      [assignmentId]: state
    }));
  }, []);

  // Fetch assignments - delegate to optimized hook
  const fetchAssignments = optimizedRefetch;

  // Create assignment - delegate to optimized hook
  const createAssignment = optimizedCreateAssignment;

  // Update assignment - delegate to optimized hook
  const updateAssignment = optimizedUpdateAssignment;
  
  // Delete assignment - delegate to optimized hook
  const deleteAssignment = optimizedDeleteAssignment;

  // Publish assignment - delegate to optimized hook
  const publishAssignment = optimizedPublishAssignment;

  // Publish assignments by date - delegate to optimized hook
  const publishAssignmentsByDate = optimizedPublishAssignmentsByDate;

  return {
    assignments,
    loading,
    error,
    operationStates,
    fetchAssignments,
    setAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate,
    isDialogOpen,
    setIsDialogOpen,
    setOperationState
  };
};
