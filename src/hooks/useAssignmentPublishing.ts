
import { Assignment } from '@/types/assignment';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';

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
      return false;
    }
    
    console.log(`Publishing ${assignmentsToUpdate.length} assignments for date ${date}`);
    
    try {
      // Update assignments directly in the database for better performance
      // Get all the assignment IDs
      const assignmentIds = assignmentsToUpdate.map(a => a.id);
      
      console.log("Assignment IDs to update:", assignmentIds);
      
      // Update all assignments in a single database operation
      const { error, data } = await supabase
        .from('assignments')
        .update({ published: true })
        .in('id', assignmentIds);
        
      if (error) {
        console.error("Error updating assignments in database:", error);
        throw error;
      }
      
      console.log("Supabase batch update response:", data);
      
      // Update the local state to reflect the changes
      const updatedAssignments = assignments.map(a => 
        assignmentIds.includes(a.id) ? { ...a, published: true } : a
      );
      
      // Note: Since we're using the hook pattern, we don't update state directly here
      // but rely on the component to update its own state with the latest assignments
      
      toast({
        title: t("planner.assignmentsPublished"),
        description: t("planner.assignmentsPublishedMsg"),
      });
      
      return true;
    } catch (error) {
      console.error(`Error publishing assignments for date ${date}:`, error);
      toast({
        title: t("common.error"),
        description: t("planner.errorPublishingAssignments"),
        variant: "destructive"
      });
      return false;
    }
  };

  const publishAssignments = async (assignmentIds: string[]) => {
    const assignmentsToUpdate = assignments.filter(a => 
      assignmentIds.includes(a.id) && !a.published
    );
    
    if (assignmentsToUpdate.length === 0) {
      console.log(`No unpublished assignments found with IDs: ${assignmentIds.join(', ')}`);
      return false;
    }
    
    console.log(`Publishing ${assignmentsToUpdate.length} assignments`);
    
    try {
      // Update assignments directly in the database
      const { error, data } = await supabase
        .from('assignments')
        .update({ published: true })
        .in('id', assignmentIds);
        
      if (error) {
        console.error("Error updating assignments in database:", error);
        throw error;
      }
      
      toast({
        title: t("planner.assignmentsPublished"),
        description: t("planner.assignmentsPublishedMsg"),
      });
      
      return true;
    } catch (error) {
      console.error("Error publishing assignments:", error);
      toast({
        title: t("common.error"),
        description: t("planner.errorPublishingAssignments"),
        variant: "destructive"
      });
      return false;
    }
  };

  const publishAssignment = async (assignmentId: string) => {
    const assignmentToUpdate = assignments.find(a => 
      a.id === assignmentId && !a.published
    );
    
    if (!assignmentToUpdate) {
      console.log(`No unpublished assignment found with ID: ${assignmentId}`);
      return false;
    }
    
    console.log(`Publishing assignment: ${assignmentToUpdate.title} (${assignmentId})`);
    
    try {
      // Update directly with supabase
      const { error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('id', assignmentId);
        
      if (error) {
        console.error(`Error publishing assignment ${assignmentId} in database:`, error);
        throw error;
      }
      
      toast({
        title: t("planner.assignmentPublished"),
        description: t("planner.assignmentPublishedMsg"),
      });
      
      return true;
    } catch (error) {
      console.error(`Error publishing assignment ${assignmentId}:`, error);
      toast({
        title: t("common.error"),
        description: t("planner.errorPublishingAssignment"),
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    publishAssignments,
    publishAssignment,
    publishAssignmentsByDate
  };
};
