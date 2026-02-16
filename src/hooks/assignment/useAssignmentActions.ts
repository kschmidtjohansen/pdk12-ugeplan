import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { isValidUUID, safeUUID } from '@/utils/uuidValidation';
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

      if (employee.is_temporary && employee.expires_at) {
        const expiryDate = new Date(employee.expires_at);
        if (expiryDate < new Date()) {
          return { valid: false, error: `Employee ${employee.name} has expired (expired: ${expiryDate.toLocaleDateString()})` };
        }
      }

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
      if (import.meta.env.DEV) console.log("[useAssignmentActions] ===== CREATE ASSIGNMENT START =====");
      if (import.meta.env.DEV) console.log("[useAssignmentActions] Full assignment data received:", JSON.stringify(assignmentData, null, 2));
      
      const dates = (assignmentData as any).dates || [assignmentData.date];
      const isMultiDate = dates.length > 1;
      
      if (import.meta.env.DEV) console.log("[useAssignmentActions] Multi-date creation:", { isMultiDate, dateCount: dates.length, dates });
      
      // Format car information for storage
      let carId = null;
      if (assignmentData.car) {
        if (typeof assignmentData.car === 'string') {
          carId = safeUUID(assignmentData.car);
        } else if (typeof assignmentData.car === 'object') {
          carId = safeUUID((assignmentData.car as Car).id);
        }
      }
      
      // Format responsible user ID for storage
      let responsibleUserId = null;
      if (assignmentData.responsibleUserId) {
        responsibleUserId = safeUUID(assignmentData.responsibleUserId);
      } else if (assignmentData.responsibleUser?.id) {
        responsibleUserId = safeUUID(assignmentData.responsibleUser.id);
      }
      if (import.meta.env.DEV) console.log("[useAssignmentActions] Final responsibleUserId to store:", responsibleUserId);

      // Validate required fields
      if (!assignmentData.title || !assignmentData.location || !dates[0] || !assignmentData.fromTime || !assignmentData.toTime) {
        const missingFields = [];
        if (!assignmentData.title) missingFields.push('title');
        if (!assignmentData.location) missingFields.push('location');
        if (!dates[0]) missingFields.push('date');
        if (!assignmentData.fromTime) missingFields.push('fromTime');
        if (!assignmentData.toTime) missingFields.push('toTime');
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const createdAssignmentIds: string[] = [];
      const errors: Array<{ date: string; error: any }> = [];
      
      if (import.meta.env.DEV) console.log(`[useAssignmentActions] Starting loop to create ${dates.length} assignment(s)`);
      
      for (let i = 0; i < dates.length; i++) {
        const dateStr = dates[i];
        if (import.meta.env.DEV) console.log(`[useAssignmentActions] Processing date ${i + 1}/${dates.length}: ${dateStr}`);

        try {
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
              zip_code: assignmentData.zip_code || null,
              city: assignmentData.city || null,
              lat: assignmentData.lat ?? null,
              lng: assignmentData.lng ?? null,
              ...(isDemoMode && { is_demo: true })
            })
            .select('id')
            .single();

          if (import.meta.env.DEV) console.log(`[useAssignmentActions] Assignment insert result for date ${dateStr}:`, { newAssignment, error });
          
          if (error) {
            console.error(`[useAssignmentActions] Assignment insert FAILED for date ${dateStr}:`, error);
            errors.push({ date: dateStr, error });
            continue;
          }
          
          if (!newAssignment?.id) {
            console.error(`[useAssignmentActions] No assignment ID returned for date ${dateStr}`);
            errors.push({ date: dateStr, error: 'No ID returned' });
            continue;
          }
          
          if (import.meta.env.DEV) console.log(`[useAssignmentActions] Assignment created for date ${dateStr}, ID: ${newAssignment.id}`);
          createdAssignmentIds.push(newAssignment.id);
          
          // Link employees
          if (assignmentData.employees && assignmentData.employees.length > 0) {
            if (import.meta.env.DEV) console.log("Assignment created, now linking employees:", assignmentData.employees);
            const employeeInserts = [];
            const validationErrors: string[] = [];
            
            for (const employeeId of assignmentData.employees) {
              if (typeof employeeId !== 'string') {
                validationErrors.push(`Invalid employee data type`);
                continue;
              }
              
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
                  user_id: validEmployeeId,
                  ...(isDemoMode && { is_demo: true })
                });
              } else {
                validationErrors.push(`Invalid employee ID: ${employeeId}`);
              }
            }
            
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
            
            if (validationErrors.length > 0) {
              toast({
                title: t('common.warning'),
                description: `Some employees could not be added: ${validationErrors.join(', ')}`,
                variant: "destructive",
              });
            }
          }
        } catch (insertError) {
          console.error(`[useAssignmentActions] Exception during insert for date ${dateStr}:`, insertError);
          errors.push({ date: dateStr, error: insertError });
          continue;
        }
      }
      
      if (import.meta.env.DEV) console.log(`[useAssignmentActions] Summary: ${createdAssignmentIds.length} created, ${errors.length} errors`);
      
      if (createdAssignmentIds.length > 0) {
        const successMsg = isMultiDate 
          ? `${createdAssignmentIds.length} opgaver oprettet for "${assignmentData.title}"`
          : `Opgave "${assignmentData.title}" oprettet`;
        
        toast({
          title: isMultiDate ? t('planner.assignmentsCreated') : t('planner.assignmentCreated'),
          description: successMsg,
        });
        
        if (errors.length > 0) {
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
      
      if (import.meta.env.DEV) console.log('[useAssignmentActions] Clearing cache and refetching');
      enhancedDataFetching.clearCache('assignments');
      await refetch();
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
  }, [toast, t, refetch, setIsDialogOpen, user?.email, isDemoMode]);

  // Update an existing assignment
  const updateAssignment = useCallback(async (id: string, assignmentData: Partial<Assignment>) => {
    try {
      if (import.meta.env.DEV) console.log("[useAssignmentActions] ===== UPDATE ASSIGNMENT START =====");
      if (import.meta.env.DEV) console.log("[useAssignmentActions] Full assignment data received:", assignmentData);
      
      const dates = (assignmentData as any).dates || [];
      const hasMultipleDates = dates.length > 1;
      
      if (import.meta.env.DEV) console.log("[useAssignmentActions] Multi-date check:", { dates, hasMultipleDates });

      if (!isValidUUID(id)) {
        throw new Error('Invalid assignment ID provided');
      }
      
      // Format car information
      let carId = null;
      if (assignmentData.car) {
        if (typeof assignmentData.car === 'string') {
          carId = safeUUID(assignmentData.car);
        } else if (typeof assignmentData.car === 'object') {
          carId = safeUUID((assignmentData.car as Car).id);
        }
      }
      
      // Format responsible user ID
      let responsibleUserId = null;
      if (assignmentData.responsibleUserId) {
        responsibleUserId = safeUUID(assignmentData.responsibleUserId);
      } else if (assignmentData.responsibleUser?.id) {
        responsibleUserId = safeUUID(assignmentData.responsibleUser.id);
      }
      if (import.meta.env.DEV) console.log("[useAssignmentActions] Final responsibleUserId to store:", responsibleUserId);

      // Update the existing assignment
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
          zip_code: assignmentData.zip_code || null,
          city: assignmentData.city || null,
          lat: assignmentData.lat ?? null,
          lng: assignmentData.lng ?? null,
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
      
      // Link employees
      if (assignmentData.employees && assignmentData.employees.length > 0) {
        if (import.meta.env.DEV) console.log("Assignment updated, now linking employees:", assignmentData.employees);
        const employeeInserts = [];
        const validationErrors: string[] = [];
        
        for (const employeeId of assignmentData.employees) {
          if (typeof employeeId !== 'string') {
            validationErrors.push(`Invalid employee data type`);
            continue;
          }
          
          const validation = await validateEmployee(employeeId);
          if (!validation.valid) {
            console.error(`Employee validation failed: ${validation.error}`);
            validationErrors.push(validation.error || 'Unknown validation error');
            continue;
          }
          
          const validEmployeeId = safeUUID(employeeId);
          if (validEmployeeId) {
            employeeInserts.push({
              assignment_id: id,
              user_id: validEmployeeId,
              ...(isDemoMode && { is_demo: true })
            });
          } else {
            validationErrors.push(`Invalid employee ID: ${employeeId}`);
          }
        }
        
        if (validationErrors.length > 0 && employeeInserts.length === 0) {
          throw new Error(`Failed to add employees: ${validationErrors.join(', ')}`);
        }
        
        if (employeeInserts.length > 0) {
          const { error: employeeError } = await client
            .from('assignments_employees')
            .insert(employeeInserts);
            
          if (employeeError) {
            console.error('Error linking employees to assignment:', employeeError);
            throw new Error(`Failed to link employees: ${employeeError.message}`);
          }
        }
        
        if (validationErrors.length > 0) {
          toast({
            title: t('common.warning'),
            description: `Some employees could not be added: ${validationErrors.join(', ')}`,
            variant: "destructive",
          });
        }
      }
      
      // Create additional assignments for extra dates
      if (hasMultipleDates) {
        if (import.meta.env.DEV) console.log("[useAssignmentActions] Creating additional assignments for other dates");
        
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
            zip_code: assignmentData.zip_code || null,
            city: assignmentData.city || null,
            lat: assignmentData.lat ?? null,
            lng: assignmentData.lng ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...(isDemoMode && { is_demo: true })
          };
          
          const { data: newAssignment, error: createError } = await client
            .from('assignments')
            .insert(newAssignmentData)
            .select()
            .single();
            
          if (createError) {
            console.error(`Error creating assignment for date ${dates[i]}:`, createError);
            continue;
          }
          
          if (assignmentData.employees && assignmentData.employees.length > 0 && newAssignment) {
            const employeeInserts = assignmentData.employees
              .filter(empId => typeof empId === 'string')
              .map(empId => ({
                assignment_id: newAssignment.id,
                user_id: safeUUID(empId),
                ...(isDemoMode && { is_demo: true })
              }))
              .filter(insert => insert.user_id !== null);
              
            if (employeeInserts.length > 0) {
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
  }, [toast, t, refetch, setIsDialogOpen, user?.email, isDemoMode]);
  
  // Delete an assignment
  const deleteAssignment = useCallback(async (id: string) => {
    try {
      if (import.meta.env.DEV) console.log('[useAssignmentActions] Deleting assignment:', id);
      
      await OptimizedAssignmentService.deleteAssignment(id);
      
      toast({
        title: t('planner.assignmentDeleted'),
        description: t('planner.assignmentDeletedMsg'),
      });
      
      if (import.meta.env.DEV) console.log('[useAssignmentActions] Clearing cache after deletion');
      enhancedDataFetching.clearCache('assignments');
      await refetch();
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
  }, [toast, t, refetch, user?.email, isDemoMode]);

  // Publish an assignment
  const publishAssignment = useCallback(async (id: string) => {
    try {
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
  }, [toast, t, refetch, user?.email, isDemoMode]);

  // Publish all assignments for a specific date
  const publishAssignmentsByDate = useCallback(async (date: string) => {
    try {
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
  }, [toast, t, refetch, user?.email, isDemoMode]);

  return {
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate
  };
};
