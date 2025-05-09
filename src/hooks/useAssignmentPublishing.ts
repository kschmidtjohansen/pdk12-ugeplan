
import { Assignment } from '@/types/assignment';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';

// Utility function to ensure edited assignments are unpublished
export const getUnpublishedAssignment = (assignment: Assignment) => {
  return {
    ...assignment,
    published: false 
  };
};

// Hook for publishing assignments
export const useAssignmentPublishing = (
  assignments: Assignment[], 
  updateAssignment: (assignment: Assignment) => Promise<boolean>
) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const publishAssignmentsByDate = (date: string) => {
    const assignmentsToUpdate = assignments.filter(a => 
      a.date === date && !a.published
    );
    
    if (assignmentsToUpdate.length === 0) {
      return;
    }
    
    // Update each assignment
    Promise.all(
      assignmentsToUpdate.map(a => 
        updateAssignment({ ...a, published: true })
      )
    );
    
    toast({
      title: t("planner.assignmentsPublished"),
      description: t("planner.assignmentsPublishedMsg"),
    });
  };

  const publishAssignments = (assignmentIds: string[]) => {
    const assignmentsToUpdate = assignments.filter(a => 
      assignmentIds.includes(a.id) && !a.published
    );
    
    if (assignmentsToUpdate.length === 0) {
      return;
    }
    
    // Update each assignment
    Promise.all(
      assignmentsToUpdate.map(a => 
        updateAssignment({ ...a, published: true })
      )
    );
    
    toast({
      title: t("planner.assignmentsPublished"),
      description: t("planner.assignmentsPublishedMsg"),
    });
  };

  const publishAssignment = (assignmentId: string) => {
    const assignmentToUpdate = assignments.find(a => 
      a.id === assignmentId && !a.published
    );
    
    if (!assignmentToUpdate) {
      return;
    }
    
    updateAssignment({ ...assignmentToUpdate, published: true });
    
    toast({
      title: t("planner.assignmentPublished"),
      description: t("planner.assignmentPublishedMsg"),
    });
  };

  return {
    publishAssignments,
    publishAssignment,
    publishAssignmentsByDate
  };
};
