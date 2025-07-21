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

  const publishAllUnpublishedAssignments = async () => {
    console.log(`[Publishing] Starting to publish all unpublished assignments`);
    
    const unpublishedAssignments = assignments.filter(a => !a.published);
    
    if (unpublishedAssignments.length === 0) {
      console.log(`[Publishing] No unpublished assignments found`);
      toast({
        title: t("planner.noAssignmentsToPublish"),
        description: t("planner.noUnpublishedAssignments"),
      });
      return false;
    }
    
    console.log(`[Publishing] Publishing ${unpublishedAssignments.length} unpublished assignments`);
    
    try {
      // Get all the assignment IDs
      const assignmentIds = unpublishedAssignments.map(a => a.id);
      
      console.log("[Publishing] Assignment IDs to update:", assignmentIds);
      
      // Update all assignments in a single database operation
      const { error, data } = await supabase
        .from('assignments')
        .update({ published: true })
        .in('id', assignmentIds)
        .select();
        
      if (error) {
        console.error("[Publishing] Error updating assignments in database:", error);
        throw error;
      }
      
      console.log("[Publishing] Supabase batch update response:", data);
      
      toast({
        title: t("planner.assignmentsPublished"),
        description: `Published ${unpublishedAssignments.length} assignments`,
      });
      
      return true;
    } catch (error) {
      console.error(`[Publishing] Error publishing all assignments:`, error);
      toast({
        title: t("common.error"),
        description: t("planner.errorPublishingAssignments"),
        variant: "destructive"
      });
      return false;
    }
  };

  const publishAssignmentsByDate = async (date: string) => {
    console.log(`[Publishing] Starting to publish assignments for date: ${date}`);
    
    const assignmentsToUpdate = assignments.filter(a => 
      a.date === date && !a.published
    );
    
    if (assignmentsToUpdate.length === 0) {
      console.log(`[Publishing] No unpublished assignments found for date ${date}`);
      toast({
        title: t("planner.noAssignmentsToPublish"),
        description: t("planner.noUnpublishedAssignments"),
      });
      return false;
    }
    
    console.log(`[Publishing] Publishing ${assignmentsToUpdate.length} assignments for date ${date}`);
    
    try {
      // Get all the assignment IDs
      const assignmentIds = assignmentsToUpdate.map(a => a.id);
      
      console.log("[Publishing] Assignment IDs to update:", assignmentIds);
      
      // Update all assignments in a single database operation
      const { error, data } = await supabase
        .from('assignments')
        .update({ published: true })
        .in('id', assignmentIds)
        .select();
        
      if (error) {
        console.error("[Publishing] Error updating assignments in database:", error);
        throw error;
      }
      
      console.log("[Publishing] Supabase batch update response:", data);
      
      toast({
        title: t("planner.assignmentsPublished"),
        description: t("planner.assignmentsPublishedMsg"),
      });
      
      return true;
    } catch (error) {
      console.error(`[Publishing] Error publishing assignments for date ${date}:`, error);
      toast({
        title: t("common.error"),
        description: t("planner.errorPublishingAssignments"),
        variant: "destructive"
      });
      return false;
    }
  };

  const publishAssignments = async (assignmentIds: string[]) => {
    console.log(`[Publishing] Publishing assignments with IDs:`, assignmentIds);
    
    const assignmentsToUpdate = assignments.filter(a => 
      assignmentIds.includes(a.id) && !a.published
    );
    
    if (assignmentsToUpdate.length === 0) {
      console.log(`[Publishing] No unpublished assignments found with IDs: ${assignmentIds.join(', ')}`);
      return false;
    }
    
    console.log(`[Publishing] Publishing ${assignmentsToUpdate.length} assignments`);
    
    try {
      // Update assignments directly in the database
      const { error, data } = await supabase
        .from('assignments')
        .update({ published: true })
        .in('id', assignmentIds)
        .select();
        
      if (error) {
        console.error("[Publishing] Error updating assignments in database:", error);
        throw error;
      }
      
      console.log("[Publishing] Batch update successful:", data);
      
      toast({
        title: t("planner.assignmentsPublished"),
        description: t("planner.assignmentsPublishedMsg"),
      });
      
      return true;
    } catch (error) {
      console.error("[Publishing] Error publishing assignments:", error);
      toast({
        title: t("common.error"),
        description: t("planner.errorPublishingAssignments"),
        variant: "destructive"
      });
      return false;
    }
  };

  const publishAssignment = async (assignmentId: string) => {
    console.log(`[Publishing] Publishing single assignment: ${assignmentId}`);
    
    const assignmentToUpdate = assignments.find(a => 
      a.id === assignmentId && !a.published
    );
    
    if (!assignmentToUpdate) {
      console.log(`[Publishing] No unpublished assignment found with ID: ${assignmentId}`);
      toast({
        title: t("planner.assignmentAlreadyPublished"),
        description: t("planner.assignmentAlreadyPublishedMsg"),
      });
      return false;
    }
    
    console.log(`[Publishing] Publishing assignment: ${assignmentToUpdate.title} (${assignmentId})`);
    
    try {
      // Update directly with supabase
      const { error, data } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('id', assignmentId)
        .select();
        
      if (error) {
        console.error(`[Publishing] Error publishing assignment ${assignmentId} in database:`, error);
        throw error;
      }
      
      console.log(`[Publishing] Assignment ${assignmentId} published successfully:`, data);
      
      toast({
        title: t("planner.assignmentPublished"),
        description: t("planner.assignmentPublishedMsg"),
      });
      
      return true;
    } catch (error) {
      console.error(`[Publishing] Error publishing assignment ${assignmentId}:`, error);
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
    publishAssignmentsByDate,
    publishAllUnpublishedAssignments
  };
};
