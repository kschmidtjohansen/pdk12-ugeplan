
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

  const publishAssignmentsByDate = async (date: string) => {
    const assignmentsToUpdate = assignments.filter(a => 
      a.date === date && !a.published
    );
    
    if (assignmentsToUpdate.length === 0) {
      console.log(`No unpublished assignments found for date ${date}`);
      toast({
        title: t("planner.noAssignmentsToPublish"),
        description: t("planner.noUnpublishedAssignments"),
      });
      return;
    }
    
    console.log(`Publishing ${assignmentsToUpdate.length} assignments for date ${date}`);
    
    try {
      // Properly await the Promise.all to ensure all assignments are updated
      const results = await Promise.all(
        assignmentsToUpdate.map(a => 
          updateAssignment({ ...a, published: true })
        )
      );
      
      const successCount = results.filter(Boolean).length;
      console.log(`Successfully published ${successCount} of ${assignmentsToUpdate.length} assignments`);
      
      toast({
        title: t("planner.assignmentsPublished"),
        description: t("planner.assignmentsPublishedMsg"),
      });
    } catch (error) {
      console.error(`Error publishing assignments for date ${date}:`, error);
      toast({
        title: t("common.error"),
        description: t("planner.errorPublishingAssignments"),
        variant: "destructive"
      });
    }
  };

  const publishAssignments = async (assignmentIds: string[]) => {
    const assignmentsToUpdate = assignments.filter(a => 
      assignmentIds.includes(a.id) && !a.published
    );
    
    if (assignmentsToUpdate.length === 0) {
      console.log(`No unpublished assignments found with IDs: ${assignmentIds.join(', ')}`);
      return;
    }
    
    console.log(`Publishing ${assignmentsToUpdate.length} assignments`);
    
    try {
      // Properly await the Promise.all to ensure all assignments are updated
      const results = await Promise.all(
        assignmentsToUpdate.map(a => 
          updateAssignment({ ...a, published: true })
        )
      );
      
      const successCount = results.filter(Boolean).length;
      console.log(`Successfully published ${successCount} of ${assignmentsToUpdate.length} assignments`);
      
      toast({
        title: t("planner.assignmentsPublished"),
        description: t("planner.assignmentsPublishedMsg"),
      });
    } catch (error) {
      console.error("Error publishing assignments:", error);
      toast({
        title: t("common.error"),
        description: t("planner.errorPublishingAssignments"),
        variant: "destructive"
      });
    }
  };

  const publishAssignment = async (assignmentId: string) => {
    const assignmentToUpdate = assignments.find(a => 
      a.id === assignmentId && !a.published
    );
    
    if (!assignmentToUpdate) {
      console.log(`No unpublished assignment found with ID: ${assignmentId}`);
      return;
    }
    
    console.log(`Publishing assignment: ${assignmentToUpdate.title} (${assignmentId})`);
    
    try {
      const success = await updateAssignment({ ...assignmentToUpdate, published: true });
      
      if (success) {
        toast({
          title: t("planner.assignmentPublished"),
          description: t("planner.assignmentPublishedMsg"),
        });
      } else {
        toast({
          title: t("common.error"),
          description: t("planner.errorPublishingAssignment"),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Error publishing assignment ${assignmentId}:`, error);
      toast({
        title: t("common.error"),
        description: t("planner.errorPublishingAssignment"),
        variant: "destructive"
      });
    }
  };

  return {
    publishAssignments,
    publishAssignment,
    publishAssignmentsByDate
  };
};
