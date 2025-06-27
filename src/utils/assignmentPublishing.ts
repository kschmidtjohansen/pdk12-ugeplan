
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';

export const publishAssignmentHandler = async (
  assignments: Assignment[],
  setAssignments: (assignments: Assignment[]) => void,
  assignmentIds?: string[] | null,
  date?: string
): Promise<boolean> => {
  try {
    let idsToPublish: string[] = [];
    
    if (assignmentIds) {
      idsToPublish = assignmentIds;
    } else if (date) {
      idsToPublish = assignments
        .filter(assignment => assignment.date === date && !assignment.published)
        .map(assignment => assignment.id);
    }
    
    if (idsToPublish.length === 0) {
      return false;
    }
    
    const { error } = await supabase
      .from('assignments')
      .update({ published: true })
      .in('id', idsToPublish);
      
    if (error) {
      console.error('Error publishing assignments:', error);
      return false;
    }
    
    // Update local state
    const updatedAssignments = assignments.map(assignment => 
      idsToPublish.includes(assignment.id) 
        ? { ...assignment, published: true }
        : assignment
    );
    
    setAssignments(updatedAssignments);
    return true;
  } catch (error) {
    console.error('Error in publishAssignmentHandler:', error);
    return false;
  }
};
