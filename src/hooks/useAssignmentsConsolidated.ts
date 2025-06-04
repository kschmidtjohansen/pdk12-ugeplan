
import { useState, useEffect } from 'react';
import { Assignment } from '@/types/assignment';
import { useAssignments } from './useAssignments';

export interface UseAssignmentsConsolidatedOptions {
  filter: 'all' | 'my' | 'planner';
}

export const useAssignmentsConsolidated = (options: UseAssignmentsConsolidatedOptions) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const {
    assignments: baseAssignments,
    loading: baseLoading,
    error: baseError,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate
  } = useAssignments();

  useEffect(() => {
    // Filter assignments based on the filter option
    let filteredAssignments = baseAssignments;
    
    switch (options.filter) {
      case 'my':
        // For now, return all assignments - you can add user filtering logic here
        filteredAssignments = baseAssignments;
        break;
      case 'planner':
        filteredAssignments = baseAssignments;
        break;
      case 'all':
      default:
        filteredAssignments = baseAssignments;
        break;
    }

    setAssignments(filteredAssignments);
    setLoading(baseLoading);
    setError(baseError);
  }, [baseAssignments, baseLoading, baseError, options.filter]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    setAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate
  };
};
