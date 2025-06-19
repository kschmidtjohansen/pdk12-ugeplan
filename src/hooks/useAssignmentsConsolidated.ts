
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from './useEmployees';
import { useVacations } from './useVacations';
import { cleanupAssignmentEmployees } from '@/utils/employeeAssignmentUtils';
import { useErrorRecovery } from './useErrorRecovery';
import { dataFetchingService } from '@/services/dataFetchingService';
import { realtimeManager } from '@/services/realtimeManager';
import { useCarDataHandler } from './assignment/useCarDataHandler';

interface UseAssignmentsConsolidatedProps {
  filter?: 'all' | 'dashboard' | 'planner';
  includeUnpublished?: boolean;
}

export const useAssignmentsConsolidated = ({ 
  filter = 'all', 
  includeUnpublished = true 
}: UseAssignmentsConsolidatedProps = {}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { canPublishTasks } = usePermissions();
  const { employees } = useEmployees();
  const { vacations } = useVacations();
  const { executeWithRecovery } = useErrorRecovery();
  const { transformCarForDatabase } = useCarDataHandler();

  // Fetch assignments with enhanced error handling and caching
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentsConsolidated] Starting enhanced assignment fetch...');
      
      const result = await executeWithRecovery(
        async () => {
          // Use the new data fetching service
          const { data: assignmentsData, error: assignmentsError, fromCache } = await dataFetchingService.fetchAssignments(includeUnpublished);
          
          if (assignmentsError) throw assignmentsError;
          
          if (fromCache) {
            console.log('[useAssignmentsConsolidated] Using cached assignment data');
          }
          
          return assignmentsData;
        },
        'Assignment Data Fetch'
      );

      if (result.error || !result.data) {
        throw result.error || new Error('No assignment data received');
      }

      const assignmentsData = result.data;
      console.log('[useAssignmentsConsolidated] Fetched assignments:', assignmentsData.length);
      
      if (assignmentsData && assignmentsData.length > 0) {
        // Process employee relationships with better error handling
        const assignmentIds = assignmentsData.map(a => a.id);
        
        const employeeResult = await executeWithRecovery(
          async () => {
            const { data: assignmentEmployees, error: employeeError } = await supabase
              .from('assignments_employees')
              .select('assignment_id, user_id')
              .in('assignment_id', assignmentIds);
            
            if (employeeError) throw employeeError;
            return assignmentEmployees;
          },
          'Assignment Employees Fetch'
        );

        let employeesByAssignment = new Map<string, string[]>();
        
        if (employeeResult.data && employeeResult.data.length > 0) {
          const userIds = [...new Set(employeeResult.data.map(ae => ae.user_id))];
          
          const profileResult = await executeWithRecovery(
            async () => {
              const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', userIds);
              
              if (profileError) throw profileError;
              return profiles;
            },
            'Employee Profiles Fetch'
          );

          if (profileResult.data) {
            const profileNames = profileResult.data.reduce((acc, profile) => {
              acc[profile.id] = profile.name;
              return acc;
            }, {} as Record<string, string>);

            employeeResult.data.forEach(ae => {
              if (!employeesByAssignment.has(ae.assignment_id)) {
                employeesByAssignment.set(ae.assignment_id, []);
              }
              const employeeName = profileNames[ae.user_id];
              if (employeeName) {
                employeesByAssignment.get(ae.assignment_id)?.push(employeeName);
              }
            });
          }
        }

        // Process car data with better error handling
        const allCarIds = new Set<string>();
        assignmentsData.forEach(assignment => {
          if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
            assignment.car_ids.forEach((carId: string) => allCarIds.add(carId));
          }
          if (assignment.car_id) {
            allCarIds.add(assignment.car_id);
          }
        });

        let carLookup = new Map();
        if (allCarIds.size > 0) {
          const carResult = await executeWithRecovery(
            async () => {
              const { data: cars, error: carsError } = await supabase
                .from('cars')
                .select('id, name, car_number')
                .in('id', Array.from(allCarIds));
              
              if (carsError) throw carsError;
              return cars;
            },
            'Car Data Fetch'
          );

          if (carResult.data) {
            carLookup = new Map(carResult.data.map(car => [car.id, car]));
          }
        }
        
        // Process assignments with optimized lookups
        const processedAssignments = assignmentsData.map(assignment => {
          // Get employees for this assignment from lookup map
          const assignmentEmployeeNames = employeesByAssignment.get(assignment.id) || [];

          // Handle multiple cars with optimized lookup
          let carData = null;
          let carsArray: string[] = [];
          
          if (assignment.car_ids && Array.isArray(assignment.car_ids) && assignment.car_ids.length > 0) {
            carsArray = assignment.car_ids;
            const firstCar = carLookup.get(assignment.car_ids[0]);
            if (firstCar) {
              carData = { id: firstCar.id, name: firstCar.name };
            }
          } else if (assignment.car_id) {
            carsArray = [assignment.car_id];
            const car = carLookup.get(assignment.car_id);
            if (car) {
              carData = { id: car.id, name: car.name };
            }
          }
          
          const processedAssignment: Assignment = {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description || '',
            date: assignment.assignment_date,
            fromTime: assignment.from_time,
            toTime: assignment.to_time,
            location: assignment.location,
            car: carData,
            cars: carsArray,
            employees: assignmentEmployeeNames,
            published: assignment.published || false,
            responsibleUser: assignment.responsible_user ? {
              id: assignment.responsible_user.id,
              name: assignment.responsible_user.name
            } : null
          };
          
          return processedAssignment;
        });
        
        // Clean up assignments by removing unavailable employees
        let cleanedAssignments = processedAssignments;
        if (employees.length > 0 && vacations.length >= 0) {
          cleanedAssignments = cleanupAssignmentEmployees(processedAssignments, employees, vacations);
          console.log('[useAssignmentsConsolidated] Applied employee availability cleanup');
        }
        
        setAssignments(cleanedAssignments);
        console.log('[useAssignmentsConsolidated] Enhanced fetch completed:', cleanedAssignments.length, 'assignments');
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error('[useAssignmentsConsolidated] Error fetching assignments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignments';
      setError(errorMessage);
      
      // Don't show toast for authentication errors (user will be redirected)
      if (!errorMessage.includes('JWT') && !errorMessage.includes('auth')) {
        toast({
          title: t('common.error'),
          description: t('planner.fetchError'),
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Create assignment with enhanced validation
  const createAssignment = async (assignmentData: Partial<Assignment>) => {
    try {
      // Validate required fields
      if (!assignmentData.title || !assignmentData.location || !assignmentData.date) {
        throw new Error('Title, location, and date are required');
      }

      console.log('[useAssignmentsConsolidated] Creating assignment with data:', assignmentData);
      
      // Use car data handler for consistent transformation
      const transformedData = transformCarForDatabase(assignmentData);
      console.log('[useAssignmentsConsolidated] Transformed car data for create:', {
        car_id: transformedData.car_id,
        car_ids: transformedData.car_ids
      });

      // Format responsible user ID
      let responsibleUserId = null;
      if (assignmentData.responsibleUser) {
        if (typeof assignmentData.responsibleUser === 'string') {
          responsibleUserId = assignmentData.responsibleUser;
        } else if (typeof assignmentData.responsibleUser === 'object') {
          responsibleUserId = assignmentData.responsibleUser.id;
        }
      }
      
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
          car_id: transformedData.car_id,
          car_ids: transformedData.car_ids,
          responsible_user_id: responsibleUserId,
          published: assignmentData.published || false,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      
      // If there are employees, link them to the assignment
      if (assignmentData.employees && assignmentData.employees.length > 0 && newAssignment?.id) {
        console.log("Assignment created, now linking employees:", assignmentData.employees);
        
        // Get profile IDs for each employee name
        const employeeInserts = [];
        
        for (const employeeName of assignmentData.employees) {
          if (typeof employeeName !== 'string' || employeeName.trim() === '') {
            if (process.env.NODE_ENV === 'development') {
              console.warn("Skipping invalid employee data:", employeeName);
            }
            continue;
          }
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('name', employeeName.trim())
            .single();
            
          if (profileError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Error getting profile by name:', profileError);
            }
            continue;
          }
          
          if (profile?.id) {
            employeeInserts.push({
              assignment_id: newAssignment.id,
              user_id: profile.id
            });
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
      
      fetchAssignments();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      const errorMessage = error.message || t('planner.errorCreatingAssignment');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Update assignment - FIXED: Enhanced car handling with useCarDataHandler
  const updateAssignment = async (id: string, assignmentData: Partial<Assignment>) => {
    try {
      console.log('[useAssignmentsConsolidated] ===== UPDATE ASSIGNMENT =====');
      console.log('[useAssignmentsConsolidated] Updating assignment ID:', id);
      console.log('[useAssignmentsConsolidated] Assignment data received:', assignmentData);
      console.log('[useAssignmentsConsolidated] Car data before transformation:', {
        car: assignmentData.car,
        carType: typeof assignmentData.car,
        isEmpty: !assignmentData.car || assignmentData.car === ''
      });
      
      // Use car data handler for consistent transformation
      const transformedData = transformCarForDatabase(assignmentData);
      console.log('[useAssignmentsConsolidated] Transformed car data for update:', {
        car_id: transformedData.car_id,
        car_ids: transformedData.car_ids
      });

      // Format responsible user ID
      let responsibleUserId = null;
      if (assignmentData.responsibleUser) {
        if (typeof assignmentData.responsibleUser === 'string') {
          responsibleUserId = assignmentData.responsibleUser;
        } else if (typeof assignmentData.responsibleUser === 'object') {
          responsibleUserId = assignmentData.responsibleUser.id;
        }
      }
      
      // CRITICAL: Always unpublish when editing - this is the main fix
      const updatePayload = {
        title: assignmentData.title,
        description: assignmentData.description,
        location: assignmentData.location,
        assignment_date: assignmentData.date,
        from_time: assignmentData.fromTime,
        to_time: assignmentData.toTime,
        car_id: transformedData.car_id,
        car_ids: transformedData.car_ids,
        responsible_user_id: responsibleUserId,
        published: false, // ALWAYS unpublish when editing - this is the key fix
        updated_at: new Date().toISOString()
      };
      
      console.log('[useAssignmentsConsolidated] Update payload being sent to database:', updatePayload);
      console.log('[useAssignmentsConsolidated] PUBLISHED STATUS BEING SET TO:', false);
      console.log('[useAssignmentsConsolidated] CAR FIELDS BEING SET TO:', {
        car_id: updatePayload.car_id,
        car_ids: updatePayload.car_ids
      });
      
      // Update the assignment - ALWAYS UNPUBLISH WHEN EDITING
      const { error } = await supabase
        .from('assignments')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        console.error('[useAssignmentsConsolidated] Database update error:', error);
        throw error;
      }
      
      console.log('[useAssignmentsConsolidated] Database update successful - assignment should now be unpublished with correct car data');
      
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
          if (typeof employeeName !== 'string') {
            console.warn("Skipping invalid employee data:", employeeName);
            continue;
          }
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('name', employeeName)
            .single();
            
          if (profileError) {
            console.error('Error getting profile by name:', profileError);
            continue;
          }
          
          if (profile?.id) {
            employeeInserts.push({
              assignment_id: id,
              user_id: profile.id
            });
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
      
      console.log('[useAssignmentsConsolidated] Refreshing assignments after update...');
      fetchAssignments();
      return true;
    } catch (error: any) {
      console.error('[useAssignmentsConsolidated] Error updating assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorUpdatingAssignment'),
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Delete assignment
  const deleteAssignment = async (id: string) => {
    try {
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
      
      fetchAssignments();
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
  };

  // FIXED: Publish single assignment with comprehensive logging and error handling
  const publishAssignment = async (id: string) => {
    try {
      console.log('[Publishing] ===== PUBLISH ASSIGNMENT START =====');
      console.log('[Publishing] Assignment ID to publish:', id);
      console.log('[Publishing] Current user permissions:', { canPublishTasks });
      
      // Check permissions first
      if (!canPublishTasks) {
        console.error('[Publishing] User does not have permission to publish assignments');
        toast({
          title: t('common.error'),
          description: 'You do not have permission to publish assignments.',
          variant: "destructive",
        });
        return false;
      }
      
      // Find the current assignment to check its status
      const currentAssignment = assignments.find(a => a.id === id);
      console.log('[Publishing] Current assignment found:', currentAssignment);
      console.log('[Publishing] Current published status:', currentAssignment?.published);
      
      if (!currentAssignment) {
        console.error('[Publishing] Assignment not found in local state');
        toast({
          title: t('common.error'),
          description: 'Assignment not found.',
          variant: "destructive",
        });
        return false;
      }
      
      if (currentAssignment.published) {
        console.log('[Publishing] Assignment is already published, skipping');
        toast({
          title: t('common.info'),
          description: 'Assignment is already published.',
        });
        return false;
      }
      
      console.log('[Publishing] Attempting database update...');
      console.log('[Publishing] Update query: assignments table, set published = true, where id =', id);
      
      const { data, error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('id', id)
        .select('id, published'); // Select to verify the update
        
      console.log('[Publishing] Database response data:', data);
      console.log('[Publishing] Database response error:', error);

      if (error) {
        console.error('[Publishing] Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('[Publishing] No data returned from update - assignment may not exist');
        throw new Error('Assignment not found or could not be updated');
      }
      
      console.log('[Publishing] Database update successful, updated assignment:', data[0]);
      
      toast({
        title: t('planner.assignmentPublished'),
        description: t('planner.assignmentPublishedMsg'),
      });
      
      console.log('[Publishing] Refreshing assignments list...');
      await fetchAssignments();
      console.log('[Publishing] ===== PUBLISH ASSIGNMENT SUCCESS =====');
      return true;
    } catch (error: any) {
      console.error('[Publishing] ===== PUBLISH ASSIGNMENT ERROR =====');
      console.error('[Publishing] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause
      });
      
      let errorMessage = t('planner.errorPublishingAssignment');
      
      // Provide specific error messages based on error type
      if (error?.message?.includes('permission denied')) {
        errorMessage = 'You do not have permission to publish this assignment.';
      } else if (error?.message?.includes('not found')) {
        errorMessage = 'Assignment not found. It may have been deleted.';
      } else if (error?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
      console.log('[Publishing] ===== PUBLISH ASSIGNMENT ERROR END =====');
      return false;
    }
  };

  // FIXED: Publish assignments by date with enhanced logging
  const publishAssignmentsByDate = async (date: string) => {
    try {
      console.log('[Publishing] ===== PUBLISH DAY START =====');
      console.log('[Publishing] Publishing assignments for date:', date);
      console.log('[Publishing] Current user permissions:', { canPublishTasks });
      
      // Check permissions
      if (!canPublishTasks) {
        console.error('[Publishing] User does not have permission to publish assignments');
        toast({
          title: t('common.error'),
          description: 'You do not have permission to publish assignments.',
          variant: "destructive",
        });
        return false;
      }
      
      // Find unpublished assignments for this date
      const unpublishedAssignments = assignments.filter(a => a.date === date && !a.published);
      console.log('[Publishing] Unpublished assignments for date:', unpublishedAssignments.length);
      console.log('[Publishing] Assignment IDs to publish:', unpublishedAssignments.map(a => a.id));
      
      if (unpublishedAssignments.length === 0) {
        console.log('[Publishing] No unpublished assignments found for this date');
        toast({
          title: t('common.info'),
          description: 'No unpublished assignments found for this date.',
        });
        return false;
      }
      
      console.log('[Publishing] Attempting to publish', unpublishedAssignments.length, 'assignments');
      
      const { data, error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('assignment_date', date)
        .eq('published', false)
        .select('id, published'); // Select to verify the updates

      console.log('[Publishing] Batch update response data:', data);
      console.log('[Publishing] Batch update response error:', error);

      if (error) {
        console.error('[Publishing] Batch update error:', error);
        throw error;
      }
      
      console.log('[Publishing] Successfully published', data?.length || 0, 'assignments');
      
      toast({
        title: t('planner.dayPublished'),
        description: t('planner.dayPublishedMsg'),
      });
      
      console.log('[Publishing] Refreshing assignments after day publish...');
      await fetchAssignments();
      console.log('[Publishing] ===== PUBLISH DAY SUCCESS =====');
      return true;
    } catch (error: any) {
      console.error('[Publishing] ===== PUBLISH DAY ERROR =====');
      console.error('[Publishing] Day publish error:', error);
      
      toast({
        title: t('common.error'),
        description: t('planner.errorPublishingDay'),
        variant: "destructive",
      });
      console.log('[Publishing] ===== PUBLISH DAY ERROR END =====');
      return false;
    }
  };

  // Load assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, []);
  
  // Refresh assignments when employees or vacations change (for auto-cleanup)
  useEffect(() => {
    if (employees.length > 0) {
      fetchAssignments();
    }
  }, [employees, vacations]);
  
  // Use centralized realtime manager for subscriptions
  useEffect(() => {
    const subscriptionId = `assignments_consolidated_${filter}`;
    
    const handleRealtimeUpdate = () => {
      console.log('[useAssignmentsConsolidated] Realtime update triggered');
      // Clear cache before refresh to ensure fresh data
      dataFetchingService.clearCache('assignments');
      fetchAssignments();
    };

    // Subscribe to assignments and assignments_employees tables
    const subscription = realtimeManager.subscribe(
      subscriptionId,
      ['assignments', 'assignments_employees'],
      handleRealtimeUpdate
    );

    if (!subscription) {
      console.warn('[useAssignmentsConsolidated] Failed to create realtime subscription, using polling fallback');
      const pollInterval = setInterval(() => {
        console.log('[useAssignmentsConsolidated] Polling for updates (realtime failed)');
        fetchAssignments();
      }, 30000);
      
      return () => clearInterval(pollInterval);
    }

    return () => {
      realtimeManager.unsubscribe(subscriptionId);
    };
  }, [filter]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    setAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate,
    isDialogOpen,
    setIsDialogOpen
  };
};
