import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { isValidUUID, safeUUID } from '@/utils/uuidValidation';
import { DemoUserService } from '@/services/demoUserService';

// This hook provides actions for managing assignments
export const useAssignmentActions = (
  refetch: () => void,
  setIsDialogOpen?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const demoService = DemoUserService.getInstance();

  // Helper function to get profile ID by name
  const getProfileIdByName = async (name: string): Promise<string | null> => {
    try {
      if (!name || typeof name !== 'string') {
        console.warn('Invalid name provided for profile lookup:', name);
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('name', name)
        .single();
        
      if (error) {
        console.error('Error getting profile by name:', error);
        return null;
      }
      
      // Validate the returned ID
      const profileId = safeUUID(data?.id);
      if (!profileId) {
        console.warn('Invalid UUID returned for profile:', name, data?.id);
        return null;
      }
      
      return profileId;
    } catch (err) {
      console.error('Exception getting profile by name:', err);
      return null;
    }
  };

  // Create a new assignment
  const createAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    try {
      console.log("[useAssignmentActions] ===== CREATE ASSIGNMENT START =====");
      console.log("[useAssignmentActions] Full assignment data received:", assignmentData);
      
      // Check if this is a demo user - if so, handle differently
      if (demoService.isDemoUser(user?.email)) {
        console.log("[useAssignmentActions] Demo user detected - using session storage");
        
        const demoAssignment = {
          id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: assignmentData.title,
          description: assignmentData.description,
          assignment_date: assignmentData.date,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          location: assignmentData.location,
          car_id: assignmentData.car,
          responsible_user_id: assignmentData.responsibleUserId || assignmentData.responsibleUser?.id,
          published: assignmentData.published || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isDemoData: true
        };
        
        demoService.storeDemoAssignment(demoAssignment);
        demoService.trackOperation('assignments', 'create', demoAssignment.id);
        
        toast({
          title: t('planner.assignmentCreated'),
          description: t('planner.assignmentCreatedMsg', { title: assignmentData.title }),
        });
        
        refetch();
        if (setIsDialogOpen) setIsDialogOpen(false);
        return;
      }
      console.log("[useAssignmentActions] ResponsibleUser structure:", {
        hasResponsibleUserId: !!assignmentData.responsibleUserId,
        responsibleUserId: assignmentData.responsibleUserId,
        hasResponsibleUserObject: !!assignmentData.responsibleUser,
        responsibleUserObject: assignmentData.responsibleUser,
        responsibleUserObjectId: assignmentData.responsibleUser?.id,
        responsibleUserObjectName: assignmentData.responsibleUser?.name
      });
      
      // Format car information for storage
      let carId = null;
      if (assignmentData.car) {
        if (typeof assignmentData.car === 'string') {
          carId = safeUUID(assignmentData.car);
        } else if (typeof assignmentData.car === 'object') {
          // If car is already an object, use its ID
          carId = safeUUID((assignmentData.car as Car).id);
        }
      }
      
      // Format responsible user ID for storage
      let responsibleUserId = null;
      if (assignmentData.responsibleUserId) {
        responsibleUserId = safeUUID(assignmentData.responsibleUserId);
        console.log("[useAssignmentActions] Using responsibleUserId:", responsibleUserId);
      } else if (assignmentData.responsibleUser?.id) {
        responsibleUserId = safeUUID(assignmentData.responsibleUser.id);
        console.log("[useAssignmentActions] Using responsibleUser.id:", responsibleUserId);
      } else {
        console.log("[useAssignmentActions] No responsible user found in data");
      }
      console.log("[useAssignmentActions] Final responsibleUserId to store:", responsibleUserId);

      // Validate required fields
      if (!assignmentData.title || !assignmentData.location || !assignmentData.date || !assignmentData.fromTime || !assignmentData.toTime) {
        const missingFields = [];
        if (!assignmentData.title) missingFields.push('title');
        if (!assignmentData.location) missingFields.push('location');
        if (!assignmentData.date) missingFields.push('date');
        if (!assignmentData.fromTime) missingFields.push('fromTime');
        if (!assignmentData.toTime) missingFields.push('toTime');
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log("[useAssignmentActions] Inserting assignment with data:", {
        title: assignmentData.title,
        description: assignmentData.description,
        location: assignmentData.location,
        assignment_date: assignmentData.date,
        from_time: assignmentData.fromTime,
        to_time: assignmentData.toTime,
        car_id: carId,
        responsible_user_id: responsibleUserId,
        published: assignmentData.published || false
      });

      // Insert the new assignment
      const { data: newAssignment, error } = await supabase
        .from('assignments')
        .insert({
          title: assignmentData.title,
          description: assignmentData.description,
          location: assignmentData.location,
          assignment_date: assignmentData.date,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          car_id: carId,
          responsible_user_id: responsibleUserId,
          published: assignmentData.published || false,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      console.log("[useAssignmentActions] Assignment insert result:", { newAssignment, error });
      if (error) {
        console.error("[useAssignmentActions] Assignment insert error:", error);
        throw error;
      }
      
      // If there are employees, link them to the assignment
      if (assignmentData.employees && assignmentData.employees.length > 0 && newAssignment?.id) {
        console.log("Assignment created, now linking employees:", assignmentData.employees);
        // Get profile IDs for each employee name
        const employeeInserts = [];
        
        for (const employeeName of assignmentData.employees) {
          // Skip any non-string values that might have gotten in the array
          if (typeof employeeName !== 'string') {
            console.warn("Skipping invalid employee data:", employeeName);
            continue;
          }
          
          const profileId = await getProfileIdByName(employeeName);
          if (profileId) {
            employeeInserts.push({
              assignment_id: newAssignment.id,
              user_id: profileId
            });
          } else {
            console.warn(`Could not find valid profile ID for employee: ${employeeName}`);
          }
        }
        
        // Insert employee associations
        if (employeeInserts.length > 0) {
          const { error: employeeError } = await supabase
            .from('assignments_employees')
            .insert(employeeInserts);
            
          if (employeeError) {
            console.error('Error linking employees to assignment:', employeeError);
          }
        }
      }
      
      toast({
        title: t('planner.assignmentCreated'),
        description: t('planner.assignmentCreatedMsg', { title: assignmentData.title }),
      });
      
      refetch();
      if (setIsDialogOpen) setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorCreatingAssignment'),
        variant: "destructive",
      });
    }
  }, [toast, t, refetch, setIsDialogOpen, user?.email, demoService]);

  // Update an existing assignment
  const updateAssignment = useCallback(async (id: string, assignmentData: Partial<Assignment>) => {
    try {
      console.log("[useAssignmentActions] ===== UPDATE ASSIGNMENT START =====");
      console.log("[useAssignmentActions] Full assignment data received:", assignmentData);
      
      // Check if this is a demo user - if so, handle differently
      if (demoService.isDemoUser(user?.email)) {
        console.log("[useAssignmentActions] Demo user detected - updating session storage");
        
        const updates = {
          title: assignmentData.title,
          description: assignmentData.description,
          assignment_date: assignmentData.date,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          location: assignmentData.location,
          car_id: assignmentData.car,
          responsible_user_id: assignmentData.responsibleUserId || assignmentData.responsibleUser?.id,
          published: assignmentData.published,
          updated_at: new Date().toISOString()
        };
        
        demoService.updateDemoAssignment(id, updates);
        demoService.trackOperation('assignments', 'update', id);
        
        toast({
          title: t('planner.assignmentUpdated'),
          description: t('planner.assignmentUpdatedMsg', { title: assignmentData.title }),
        });
        
        refetch();
        if (setIsDialogOpen) setIsDialogOpen(false);
        return true;
      }

      if (!isValidUUID(id)) {
        throw new Error('Invalid assignment ID provided');
      }
      console.log("[useAssignmentActions] ResponsibleUser structure:", {
        hasResponsibleUserId: !!assignmentData.responsibleUserId,
        responsibleUserId: assignmentData.responsibleUserId,
        hasResponsibleUserObject: !!assignmentData.responsibleUser,
        responsibleUserObject: assignmentData.responsibleUser,
        responsibleUserObjectId: assignmentData.responsibleUser?.id,
        responsibleUserObjectName: assignmentData.responsibleUser?.name
      });
      
      // Format car information for storage
      let carId = null;
      if (assignmentData.car) {
        if (typeof assignmentData.car === 'string') {
          carId = safeUUID(assignmentData.car);
        } else if (typeof assignmentData.car === 'object') {
          // If car is already an object, use its ID
          carId = safeUUID((assignmentData.car as Car).id);
        }
      }
      
      // Format responsible user ID for storage
      let responsibleUserId = null;
      if (assignmentData.responsibleUserId) {
        responsibleUserId = safeUUID(assignmentData.responsibleUserId);
        console.log("[useAssignmentActions] Using responsibleUserId:", responsibleUserId);
      } else if (assignmentData.responsibleUser?.id) {
        responsibleUserId = safeUUID(assignmentData.responsibleUser.id);
        console.log("[useAssignmentActions] Using responsibleUser.id:", responsibleUserId);
      } else {
        console.log("[useAssignmentActions] No responsible user found in data");
      }
      console.log("[useAssignmentActions] Final responsibleUserId to store:", responsibleUserId);

      // Update the assignment
      const { error } = await supabase
        .from('assignments')
        .update({
          title: assignmentData.title,
          description: assignmentData.description,
          location: assignmentData.location,
          assignment_date: assignmentData.date,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          car_id: carId,
          responsible_user_id: responsibleUserId,
          published: assignmentData.published,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Remove existing employee assignments
      const { error: deleteError } = await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', id);
        
      if (deleteError) {
        console.error('Error removing existing employee assignments:', deleteError);
      }
      
      // If there are employees, link them to the assignment
      if (assignmentData.employees && assignmentData.employees.length > 0) {
        console.log("Assignment updated, now linking employees:", assignmentData.employees);
        // Get profile IDs for each employee name
        const employeeInserts = [];
        
        for (const employeeName of assignmentData.employees) {
          // Skip any non-string values that might have gotten in the array
          if (typeof employeeName !== 'string') {
            console.warn("Skipping invalid employee data:", employeeName);
            continue;
          }
          
          const profileId = await getProfileIdByName(employeeName);
          if (profileId) {
            employeeInserts.push({
              assignment_id: id,
              user_id: profileId
            });
          } else {
            console.warn(`Could not find valid profile ID for employee: ${employeeName}`);
          }
        }
        
        // Insert employee associations
        if (employeeInserts.length > 0) {
          const { error: employeeError } = await supabase
            .from('assignments_employees')
            .insert(employeeInserts);
            
          if (employeeError) {
            console.error('Error linking employees to assignment:', employeeError);
          }
        }
      }
      
      toast({
        title: t('planner.assignmentUpdated'),
        description: t('planner.assignmentUpdatedMsg', { title: assignmentData.title }),
      });
      
      // Wait for refetch to complete before closing dialog
      await refetch();
      if (setIsDialogOpen) setIsDialogOpen(false);
      return true;
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorUpdatingAssignment'),
        variant: "destructive",
      });
      return false;
    }
  }, [toast, t, refetch, setIsDialogOpen, user?.email, demoService]);
  
  // Delete an assignment
  const deleteAssignment = useCallback(async (id: string) => {
    try {
      // Check if this is a demo user - if so, handle differently
      if (demoService.isDemoUser(user?.email)) {
        console.log("[useAssignmentActions] Demo user detected - removing from session storage");
        
        demoService.deleteDemoAssignment(id);
        demoService.trackOperation('assignments', 'delete', id);
        
        toast({
          title: t('planner.assignmentDeleted'),
          description: t('planner.assignmentDeletedMsg'),
        });
        
        refetch();
        return true;
      }

      if (!isValidUUID(id)) {
        throw new Error('Invalid assignment ID provided');
      }

      // First delete associated employee assignments
      const { error: empError } = await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', id);
        
      if (empError) {
        console.error('Error deleting employee assignments:', empError);
      }
      
      // Then delete the assignment
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('planner.assignmentDeleted'),
        description: t('planner.assignmentDeletedMsg'),
      });
      
      refetch();
      return true;
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorDeletingAssignment'),
        variant: "destructive",
      });
      return false;
    }
  }, [toast, t, refetch, user?.email, demoService]);

  // Publish an assignment
  const publishAssignment = useCallback(async (id: string) => {
    try {
      // Check if this is a demo user - if so, handle differently
      if (demoService.isDemoUser(user?.email)) {
        console.log("[useAssignmentActions] Demo user detected - publishing in session storage");
        
        demoService.updateDemoAssignment(id, { 
          published: true, 
          updated_at: new Date().toISOString() 
        });
        demoService.trackOperation('assignments', 'update', id);
        
        toast({
          title: t('planner.assignmentPublished'),
          description: t('planner.assignmentPublishedMsg'),
        });
        
        refetch();
        return true;
      }

      if (!isValidUUID(id)) {
        throw new Error('Invalid assignment ID provided');
      }

      const { error } = await supabase
        .from('assignments')
        .update({ published: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('planner.assignmentPublished'),
        description: t('planner.assignmentPublishedMsg'),
      });
      
      // Wait for refetch to complete before finishing
      await refetch();
      return true;
    } catch (error: any) {
      console.error('Error publishing assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorPublishingAssignment'),
        variant: "destructive",
      });
      return false;
    }
  }, [toast, t, refetch, user?.email, demoService]);

  // Publish all assignments for a specific date
  const publishAssignmentsByDate = useCallback(async (date: string) => {
    try {
      // Check if this is a demo user - if so, handle differently
      if (demoService.isDemoUser(user?.email)) {
        console.log("[useAssignmentActions] Demo user detected - publishing day in session storage");
        
        const demoAssignments = demoService.getDemoAssignments();
        const updatedAssignments = demoAssignments.map(assignment => {
          if (assignment.assignment_date === date && !assignment.published) {
            return { ...assignment, published: true, updated_at: new Date().toISOString() };
          }
          return assignment;
        });
        
        sessionStorage.setItem('demo-assignments', JSON.stringify(updatedAssignments));
        
        toast({
          title: t('planner.dayPublished'),
          description: t('planner.dayPublishedMsg', { date }),
        });
        
        refetch();
        return true;
      }

      const { error } = await supabase
        .from('assignments')
        .update({ published: true, updated_at: new Date().toISOString() })
        .eq('assignment_date', date)
        .eq('published', false);

      if (error) throw error;
      
      toast({
        title: t('planner.dayPublished'),
        description: t('planner.dayPublishedMsg', { date }),
      });
      
      // Wait for refetch to complete before finishing
      await refetch();
      return true;
    } catch (error: any) {
      console.error('Error publishing assignments by date:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorPublishingDay'),
        variant: "destructive",
      });
      return false;
    }
  }, [toast, t, refetch, user?.email, demoService]);

  return {
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate
  };
};
