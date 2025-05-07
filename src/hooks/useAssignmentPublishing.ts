
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
  updateAssignments: (updatedAssignments: Assignment[]) => void
) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const publishAssignmentsByDate = (date: string) => {
    const updatedAssignments = assignments.map(a => 
      a.date === date ? { ...a, published: true } : a
    );
    
    updateAssignments(updatedAssignments);
    toast({
      title: t("planner.assignmentsPublished"),
      description: t("planner.assignmentsPublishedMsg"),
    });
  };

  const publishAssignments = (assignmentIds: string[]) => {
    const updatedAssignments = assignments.map((a) =>
      assignmentIds.includes(a.id) ? { ...a, published: true } : a
    );
    
    updateAssignments(updatedAssignments);
    toast({
      title: t("planner.assignmentsPublished"),
      description: t("planner.assignmentsPublishedMsg"),
    });
  };

  const publishAssignment = (assignmentId: string) => {
    const updatedAssignments = assignments.map((a) =>
      a.id === assignmentId ? { ...a, published: true } : a
    );
    
    updateAssignments(updatedAssignments);
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
