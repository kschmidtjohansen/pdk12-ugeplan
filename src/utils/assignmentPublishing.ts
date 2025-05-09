
import { Assignment } from '@/types/assignment';

// Helper function for publishing assignments
export const publishAssignmentHandler = (
  assignments: Assignment[], 
  updateAssignments: (assignments: Assignment[]) => void,
  assignmentIds: string[] | null = null,
  date: string | null = null
) => {
  let updatedAssignments: Assignment[];
  
  if (assignmentIds) {
    // Update specific assignments by ID
    updatedAssignments = assignments.map((a) =>
      assignmentIds.includes(a.id) ? { ...a, published: true } : a
    );
  } else if (date) {
    // Update all assignments for a specific date
    updatedAssignments = assignments.map((a) =>
      a.date === date ? { ...a, published: true } : a
    );
  } else {
    // No updates if no criteria provided
    return false;
  }
  
  // Apply the updates
  updateAssignments(updatedAssignments);
  return true;
};
