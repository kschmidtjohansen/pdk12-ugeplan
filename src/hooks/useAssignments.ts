
import { useAssignmentData } from './assignment/useAssignmentData';
import { useAssignmentActions } from './assignment/useAssignmentActions';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';

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
  };
};
