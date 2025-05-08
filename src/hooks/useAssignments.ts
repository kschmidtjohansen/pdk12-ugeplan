
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { mockAssignments } from '@/data/mockAssignments';

// Basic CRUD operations for assignments
export const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const { toast } = useToast();
  const { t } = useTranslation();

  const createAssignment = (assignment: Assignment) => {
    setAssignments([...assignments, assignment]);
    toast({
      title: t("planner.assignmentCreated"),
      description: t("planner.assignmentCreatedMsg", { title: assignment.title }),
    });
    return assignment;
  };

  const updateAssignment = (updatedAssignment: Assignment) => {
    setAssignments(
      assignments.map((a) =>
        a.id === updatedAssignment.id ? updatedAssignment : a
      )
    );
    toast({
      title: t("planner.assignmentUpdated"),
      description: t("planner.assignmentUpdatedMsg", { title: updatedAssignment.title }),
    });
    return updatedAssignment;
  };

  const deleteAssignment = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
    toast({
      title: t("planner.assignmentDeleted"),
      description: t("planner.assignmentDeletedMsg"),
    });
  };

  return {
    assignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
};
