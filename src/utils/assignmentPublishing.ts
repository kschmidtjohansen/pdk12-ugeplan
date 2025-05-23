
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';

// Helper function for publishing assignments
export const publishAssignmentHandler = async (
  assignments: Assignment[], 
  updateAssignments: (assignments: Assignment[]) => void,
  assignmentIds: string[] | null = null,
  date: string | null = null
) => {
  let updatedAssignments: Assignment[];
  
  try {
    if (assignmentIds && assignmentIds.length > 0) {
      // Update specific assignments by ID in the database
      const { error } = await supabase
        .from('assignments')
        .update({ published: true })
        .in('id', assignmentIds);
        
      if (error) throw error;
      
      // Update the local state
      updatedAssignments = assignments.map((a) =>
        assignmentIds.includes(a.id) ? { ...a, published: true } : a
      );
      
    } else if (date) {
      // Find assignments for the specified date
      const dateAssignmentIds = assignments
        .filter(a => a.date === date && !a.published)
        .map(a => a.id);
      
      if (dateAssignmentIds.length === 0) {
        // No unpublished assignments for this date
        return false;
      }
      
      // Update all assignments for a specific date in the database
      const { error } = await supabase
        .from('assignments')
        .update({ published: true })
        .in('id', dateAssignmentIds);
        
      if (error) throw error;
      
      // Update the local state
      updatedAssignments = assignments.map((a) =>
        a.date === date ? { ...a, published: true } : a
      );
      
    } else {
      // No updates if no criteria provided
      return false;
    }
    
    // Apply the updates to the local state
    updateAssignments(updatedAssignments);
    return true;
    
  } catch (error) {
    console.error("Error in publishAssignmentHandler:", error);
    return false;
  }
};
