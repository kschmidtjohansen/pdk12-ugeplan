import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { isValidUUID, safeUUID } from '@/utils/uuidValidation';
import { DemoUserService } from '@/services/demoUserService';
import { OptimizedAssignmentService } from '@/services/optimizedAssignmentService';
import { enhancedDataFetching } from '@/services/enhancedDataFetching';

// This hook provides actions for managing assignments
export const useAssignmentActions = (
  refetch: () => void,
  setIsDialogOpen?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isDemoMode } = useAuth();
  const demoService = DemoUserService.getInstance();

  // Helper function to validate employee exists and is available
  const validateEmployee = async (employeeId: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      if (!employeeId || !isValidUUID(employeeId)) {
        return { valid: false, error: `Invalid employee ID: ${employeeId}` };
      }

      const client = getSchemaClient(isDemoMode);
      const { data: employee, error } = await client
        .from('profiles')
        .select('id, name, status, is_temporary, expires_at')
        .eq('id', employeeId)
        .single();
        
      if (error || !employee) {
        return { valid: false, error: `Employee not found: ${employeeId}` };
      }

      // Check if temporary employee is expired
      if (employee.is_temporary && employee.expires_at) {
        const expiryDate = new Date(employee.expires_at);
        if (expiryDate < new Date()) {
          return { valid: false, error: `Employee ${employee.name} has expired (expired: ${expiryDate.toLocaleDateString()})` };
        }
      }

      // Check if employee is inactive or terminated
      if (employee.status === 'terminated' || employee.status === 'inactive') {
        return { valid: false, error: `Employee ${employee.name} is ${employee.status}` };
      }
      
      return { valid: true };
    } catch (err) {
      console.error('Exception validating employee:', err);
      return { valid: false, error: `Error validating employee: ${err}` };
    }
  };

  // Create a new assignment (or multiple for multi-date)
  const createAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    try {
      console.log("[useAssignmentActions] ===== CREATE ASSIGNMENT START =====");
      console.log("[useAssignmentActions] Full assignment data received:", JSON.stringify(assignmentData, null, 2));
      
      // Check for multi-date creation
      const dates = (assignmentData as any).dates || [assignmentData.date];
      const isMultiDate = dates.length > 1;
      
      console.log("[useAssignmentActions] Multi-date creation:", { 
        isMultiDate, 
        dateCount: dates.length, 
        dates,
        datesType: typeof dates,
        isArray: Array.isArray(dates),
        firstDate: dates[0],
        allDates: dates
      });
      
      // Check if this is a demo user - if so, handle differently
      if (isDemoMode) {
        console.log("[useAssignmentActions] Demo user detected - using session storage");
        
        // Handle multi-date for demo users
        for (const dateStr of dates) {
          const demoAssignment = {
            id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: assignmentData.title,
            description: assignmentData.description,
            assignment_date: dateStr,
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
        }
        
        toast({
          title: isMultiDate ? t('planner.assignmentsCreated') : t('planner.assignmentCreated'),
          description: isMultiDate 
            ? t('planner.assignmentCreatedMultipleDays', { count: dates.length, title: assignmentData.title })
            : t('planner.assignmentCreatedMsg', { title: assignmentData.title }),
        });
        
        // For demo mode, clear cache and ensure immediate UI update
        console.log('[useAssignmentActions] Demo mode: clearing cache and refetching');
        enhancedDataFetching.clearCache('assignments');
        await refetch();
        console.log('[useAssignmentActions] Demo mode: refetch completed, closing dialog');
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
      if (import.meta.env.DEV) console.log("[useAssignmentActions] Using responsibleUserId:", responsibleUserId);
      } else if (assignmentData.responsibleUser?.id) {
        responsibleUserId = safeUUID(assignmentData.responsibleUser.id);
        if (import.meta.env.DEV) console.log("[useAssignmentActions] Using responsibleUser.id:", responsibleUserId);
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

      // Loop through all dates and create an assignment for each
      const createdAssignmentIds: string[] = [];
      const errors: Array<{ date: string; error: any }> = [];
      
      console.log(`[useAssignmentActions] Starting loop to create ${dates.length} assignment(s)`);
      
      for (let i = 0; i < dates.length; i++) {
        const dateStr = dates[i];
        console.log(`[useAssignmentActions] ===== Processing date ${i + 1}/${dates.length}: ${dateStr} =====`);
        console.log("[useAssignmentActions] Inserting assignment with data:", {
          title: assignmentData.title,
          description: assignmentData.description,
          location: assignmentData.location,
          assignment_date: dateStr,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          car_id: carId,
          responsible_user_id: responsibleUserId,
          published: assignmentData.published || false
        });

        try {
          // Insert the new assignment
          const client = getSchemaClient(isDemoMode);
          const { data: newAssignment, error } = await client
            .from('assignments')
            .insert({
              title: assignmentData.title,
              description: assignmentData.description,
              location: assignmentData.location,
              assignment_date: dateStr,
              from_time: assignmentData.fromTime,
              to_time: assignmentData.toTime,
              car_id: carId,
              responsible_user_id: responsibleUserId,
              published: assignmentData.published || false,
              created_at: new Date().toISOString(),
              ...(isDemoMode && { is_demo: true })
            })
            .select('id')
            .single();

          console.log(`[useAssignmentActions] Assignment insert result for date ${dateStr}:`, { newAssignment, error });
          
          if (error) {
            console.error(`[useAssignmentActions] ❌ Assignment insert FAILED for date ${dateStr}:`, error);
            errors.push({ date: dateStr, error });
            continue;
          }
          
          if (!newAssignment?.id) {
            console.error(`[useAssignmentActions] ❌ No assignment ID returned for date ${dateStr}`);
            errors.push({ date: dateStr, error: 'No ID returned' });
            continue;
          }
          
          console.log(`[useAssignmentActions] ✅ Assignment created successfully for date ${dateStr}, ID: ${newAssignment.id}`);
          createdAssignmentIds.push(newAssignment.id);
          
          // If there are employees, link them to the assignment
          if (assignmentData.employees && assignmentData.employees.length > 0) {
            console.log("Assignment created, now linking employees:", assignmentData.employees);
            const employeeInserts = [];
            const validationErrors: string[] = [];
            
            for (const employeeId of assignmentData.employees) {
              if (typeof employeeId !== 'string') {
                console.warn("Skipping invalid employee data:", employeeId);
                validationErrors.push(`Invalid employee data type`);
                continue;
              }
              
              // Validate employee
              const validation = await validateEmployee(employeeId);
              if (!validation.valid) {
                console.error(`Employee validation failed: ${validation.error}`);
                validationErrors.push(validation.error || 'Unknown validation error');
                continue;
              }
              
              const validEmployeeId = safeUUID(employeeId);
              if (validEmployeeId) {
                employeeInserts.push({
                  assignment_id: newAssignment.id,
                  user_id: validEmployeeId
                });
              } else {
                console.warn(`Invalid employee ID provided: ${employeeId}`);
                validationErrors.push(`Invalid employee ID: ${employeeId}`);
              }
            }
            
            // If all employees failed validation, throw error
            if (validationErrors.length > 0 && employeeInserts.length === 0) {
              throw new Error(`Failed to add employees: ${validationErrors.join(', ')}`);
            }
            
            if (employeeInserts.length > 0) {
              const client = getSchemaClient(isDemoMode);
              const { error: employeeError } = await client
                .from('assignments_employees')
                .insert(employeeInserts);
                
              if (employeeError) {
                console.error('Error linking employees to assignment:', employeeError);
                throw new Error(`Failed to link employees: ${employeeError.message}`);
              }
            }
            
            // Show warning if some employees failed
            if (validationErrors.length > 0) {
              toast({
                title: t('common.warning'),
                description: `Some employees could not be added: ${validationErrors.join(', ')}`,
                variant: "destructive",
              });
            }
          }
        } catch (insertError) {
          console.error(`[useAssignmentActions] ❌ Exception during insert for date ${dateStr}:`, insertError);
          errors.push({ date: dateStr, error: insertError });
          continue;
        }
      }
      
      // Show success message with error details if any
      console.log(`[useAssignmentActions] Summary: ${createdAssignmentIds.length} assignments created, ${errors.length} errors`);
      
      if (createdAssignmentIds.length > 0) {
        const successMsg = isMultiDate 
          ? `${createdAssignmentIds.length} opgaver oprettet for "${assignmentData.title}"`
          : `Opgave "${assignmentData.title}" oprettet`;
        
        toast({
          title: isMultiDate ? t('planner.assignmentsCreated') : t('planner.assignmentCreated'),
          description: successMsg,
        });
        
        if (errors.length > 0) {
          console.warn(`[useAssignmentActions] Some assignments failed:`, errors);
          toast({
            title: 'Delvis fejl',
            description: `${errors.length} opgave(r) kunne ikke oprettes`,
            variant: "destructive",
          });
        }
      } else {
        console.error('[useAssignmentActions] All assignments failed to create:', errors);
        throw new Error(`No assignments were created. Errors: ${errors.map(e => e.date).join(', ')}`);
      }
      
      // Clear cache and refetch to ensure immediate UI update
      console.log('[useAssignmentActions] Clearing cache and refetching after assignment creation');
      enhancedDataFetching.clearCache('assignments');
      await refetch();
      console.log('[useAssignmentActions] Refetch completed, closing dialog');
      if (setIsDialogOpen) setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      const errorMessage = error instanceof Error ? error.message : t('planner.errorCreatingAssignment');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast, t, refetch, setIsDialogOpen, user?.email, demoService]);

  // Update an existing assignment
  const updateAssignment = useCallback(async (id: string, assignmentData: Partial<Assignment>) => {
    try {
      console.log("[useAssignmentActions] ===== UPDATE ASSIGNMENT START =====");
      console.log("[useAssignmentActions] Full assignment data received:", assignmentData);
      
      // Check if multiple dates are provided (array with more than 1 date)
      const dates = (assignmentData as any).dates || [];
      const hasMultipleDates = dates.length > 1;
      
      console.log("[useAssignmentActions] Multi-date check:", { dates, hasMultipleDates });
      
      // Check if this is a demo user - if so, handle differently
      if (isDemoMode) {
        console.log("[useAssignmentActions] Demo user detected - updating session storage");
        
        const updates = {
          title: assignmentData.title,
          description: assignmentData.description,
          assignment_date: dates[0] || assignmentData.date,
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
        
        // If multiple dates, create additional assignments for other dates
        if (hasMultipleDates) {
          for (let i = 1; i < dates.length; i++) {
            const newAssignment = {
              ...updates,
              assignment_date: dates[i],
              id: `demo-${Date.now()}-${i}`,
              created_at: new Date().toISOString()
            };
            demoService.storeDemoAssignment(newAssignment);
          }
        }
        
        const message = hasMultipleDates 
          ? t('planner.assignmentCreatedMultipleDays', { count: dates.length })
          : t('planner.assignmentUpdatedMsg', { title: assignmentData.title });
        
        toast({
          title: t('planner.assignmentUpdated'),
          description: message,
        });
        
        // For demo mode, clear cache and ensure immediate UI update
        console.log('[useAssignmentActions] Demo mode update: clearing cache and refetching');
        enhancedDataFetching.clearCache('assignments');
        await refetch();
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
      if (import.meta.env.DEV) console.log("[useAssignmentActions] Using responsibleUserId:", responsibleUserId);
      } else if (assignmentData.responsibleUser?.id) {
        responsibleUserId = safeUUID(assignmentData.responsibleUser.id);
        if (import.meta.env.DEV) console.log("[useAssignmentActions] Using responsibleUser.id:", responsibleUserId);
      } else {
        if (import.meta.env.DEV) console.log("[useAssignmentActions] No responsible user found in data");
      }
      if (import.meta.env.DEV) console.log("[useAssignmentActions] Final responsibleUserId to store:", responsibleUserId);

      // Update the existing assignment (use first date if multiple dates provided)
      const updateDate = hasMultipleDates ? dates[0] : assignmentData.date;
      
      const client = getSchemaClient(isDemoMode);
      const { error } = await client
        .from('assignments')
        .update({
          title: assignmentData.title,
          description: assignmentData.description,
          location: assignmentData.location,
          assignment_date: updateDate,
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
      const { error: deleteError } = await client
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', id);
        
      if (deleteError) {
        console.error('Error removing existing employee assignments:', deleteError);
      }
      
      // If there are employees, link them to the assignment
      if (assignmentData.employees && assignmentData.employees.length > 0) {
        console.log("Assignment updated, now linking employees:", assignmentData.employees);
        const employeeInserts = [];
        const validationErrors: string[] = [];
        
        for (const employeeId of assignmentData.employees) {
          // Skip any non-string values that might have gotten in the array
          if (typeof employeeId !== 'string') {
            console.warn("Skipping invalid employee data:", employeeId);
            validationErrors.push(`Invalid employee data type`);
            continue;
          }
          
          // Validate employee
          const validation = await validateEmployee(employeeId);
          if (!validation.valid) {
            console.error(`Employee validation failed: ${validation.error}`);
            validationErrors.push(validation.error || 'Unknown validation error');
            continue;
          }
          
          // Validate that this is a proper UUID
          const validEmployeeId = safeUUID(employeeId);
          if (validEmployeeId) {
            employeeInserts.push({
              assignment_id: id,
              user_id: validEmployeeId
            });
          } else {
            console.warn(`Invalid employee ID provided: ${employeeId}`);
            validationErrors.push(`Invalid employee ID: ${employeeId}`);
          }
        }
        
        // If all employees failed validation, throw error
        if (validationErrors.length > 0 && employeeInserts.length === 0) {
          throw new Error(`Failed to add employees: ${validationErrors.join(', ')}`);
        }
        
        // Insert employee associations
        if (employeeInserts.length > 0) {
          const client = getSchemaClient(isDemoMode);
          const { error: employeeError } = await client
            .from('assignments_employees')
            .insert(employeeInserts);
            
          if (employeeError) {
            console.error('Error linking employees to assignment:', employeeError);
            throw new Error(`Failed to link employees: ${employeeError.message}`);
          }
        }
        
        // Show warning if some employees failed
        if (validationErrors.length > 0) {
          toast({
            title: t('common.warning'),
            description: `Some employees could not be added: ${validationErrors.join(', ')}`,
            variant: "destructive",
          });
        }
      }
      
      // If multiple dates were selected, create new assignments for the additional dates
      if (hasMultipleDates) {
        console.log("[useAssignmentActions] Creating additional assignments for other dates");
        
        for (let i = 1; i < dates.length; i++) {
          const newAssignmentData = {
            title: assignmentData.title,
            description: assignmentData.description,
            location: assignmentData.location,
            assignment_date: dates[i],
            from_time: assignmentData.fromTime,
            to_time: assignmentData.toTime,
            car_id: carId,
            responsible_user_id: responsibleUserId,
            published: assignmentData.published || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const client = getSchemaClient(isDemoMode);
          const { data: newAssignment, error: createError } = await client
            .from('assignments')
            .insert(newAssignmentData)
            .select()
            .single();
            
          if (createError) {
            console.error(`Error creating assignment for date ${dates[i]}:`, createError);
            continue;
          }
          
          // Link employees to the new assignment
          if (assignmentData.employees && assignmentData.employees.length > 0 && newAssignment) {
            const employeeInserts = assignmentData.employees
              .filter(empId => typeof empId === 'string')
              .map(empId => ({
                assignment_id: newAssignment.id,
                user_id: safeUUID(empId)
              }))
              .filter(insert => insert.user_id !== null);
              
            if (employeeInserts.length > 0) {
              const client = getSchemaClient(isDemoMode);
              await client
                .from('assignments_employees')
                .insert(employeeInserts);
            }
          }
        }
      }
      
      const message = hasMultipleDates 
        ? t('planner.assignmentCreatedMultipleDays', { count: dates.length })
        : t('planner.assignmentUpdatedMsg', { title: assignmentData.title });
      
      toast({
        title: t('planner.assignmentUpdated'),
        description: message,
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
      console.log('[useAssignmentActions] Deleting assignment:', id);
      
      // Use service method for consistent virtualization
      await OptimizedAssignmentService.deleteAssignment(id);
      
      toast({
        title: t('planner.assignmentDeleted'),
        description: t('planner.assignmentDeletedMsg'),
      });
      
      // Clear cache and refetch to ensure immediate UI update
      console.log('[useAssignmentActions] Clearing cache and refetching after assignment deletion');
      enhancedDataFetching.clearCache('assignments');
      await refetch();
      console.log('[useAssignmentActions] Delete refetch completed');
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

      const client = getSchemaClient(isDemoMode);
      const { error } = await client
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

      const client = getSchemaClient(isDemoMode);
      const { error } = await client
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
