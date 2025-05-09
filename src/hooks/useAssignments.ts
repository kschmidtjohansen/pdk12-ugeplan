
import { useAssignmentData } from './assignment/useAssignmentData';
import { useAssignmentActions } from './assignment/useAssignmentActions';
import { Assignment } from '@/types/assignment';

export const useAssignments = () => {
  const { 
    assignments, 
    loading, 
    error, 
    fetchAssignments 
  } = useAssignmentData();
  
  const {
    createAssignment,
    updateAssignment,
    deleteAssignment
  } = useAssignmentActions(fetchAssignments);

  return {
    assignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    fetchAssignments
  };
};
