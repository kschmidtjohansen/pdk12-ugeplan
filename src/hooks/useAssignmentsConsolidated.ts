import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from './useEmployees';
import { useVacations } from './useVacations';
import { cleanupAssignmentEmployees } from '@/utils/employeeAssignmentUtils';
import { validateEmployeeAvailability } from '@/utils/assignmentValidation';

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
  const { employees } = useEmployees();
  const { vacations } = useVacations();

  // Fetch assignments from Supabase with optimized query
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentsConsolidated] Starting optimized fetch...');
      
      // Single optimized query with all needed joins
      let query = supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          car_id,
          car_ids,
          published,
          responsible_user_id,
          created_at,
          updated_at,
          cars:car_id (
            id,
            name,
            car_number
          ),
          responsible_user:responsible_user_id (
            id,
            name
          ),
          assignments_employees (
            user_id,
            profiles:user_id (
              id,
              name
            )
          )
        `)
        .order('assignment_date', { ascending: true });

      if (!includeUnpublished) {
        query = query.eq('published', true);
      }

      const { data: assignmentsData, error: assignmentsError } = await query;
      
      if (assignmentsError) throw assignmentsError;
      
      console.log('[useAssignmentsConsolidated] Fetched assignments:', assignmentsData?.length || 0);
      
      if (assignmentsData) {
        // Get car data for multiple cars in a single query
        const allCarIds = new Set<string>();
        assignmentsData.forEach(assignment => {
          if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
            assignment.car_ids.forEach((carId: string) => allCarIds.add(carId));
          }
          if (assignment.car_id) {
            allCarIds.add(assignment.car_id);
          }
        });

        let carsData: any[] = [];
        if (allCarIds.size > 0) {
          const { data: cars, error: carsError } = await supabase
            .from('cars')
            .select('id, name, car_number')
            .in('id', Array.from(allCarIds));
          
          if (!carsError) {
            carsData = cars || [];
          }
        }
        
        // Process assignments with optimized data structure
        const processedAssignments = assignmentsData.map(assignment => {
          // Extract employee names from nested data
          const assignmentEmployeeNames: string[] = [];
          
          if (assignment.assignments_employees && Array.isArray(assignment.assignments_employees)) {
            assignment.assignments_employees.forEach((empAssignment: any) => {
              if (empAssignment.profiles?.name && typeof empAssignment.profiles.name === 'string') {
                assignmentEmployeeNames.push(empAssignment.profiles.name.trim());
              }
            });
          }

          // Handle car data
          let carData = null;
          let carsArray: string[] = [];
          
          if (assignment.car_ids && Array.isArray(assignment.car_ids) && assignment.car_ids.length > 0) {
            carsArray = assignment.car_ids;
            const firstCarId = assignment.car_ids[0];
            const firstCar = carsData.find(c => c.id === firstCarId);
            if (firstCar) {
              carData = { id: firstCar.id, name: firstCar.name };
            }
          } else if (assignment.car_id) {
            carsArray = [assignment.car_id];
            const car = carsData.find(c => c.id === assignment.car_id);
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
        
        // Apply employee availability cleanup if data is available
        let cleanedAssignments = processedAssignments;
        if (employees.length > 0 && vacations.length >= 0) {
          cleanedAssignments = cleanupAssignmentEmployees(processedAssignments, employees, vacations);
        }
        
        setAssignments(cleanedAssignments);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error('[useAssignmentsConsolidated] Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      toast({
        title: t('common.error'),
        description: t('planner.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [includeUnpublished, employees, vacations, toast, t]);

  // Create assignment with enhanced validation
  const createAssignment = async (assignmentData: Partial<Assignment>) => {
    try {
      // Validate required fields
      if (!assignmentData.title || !assignmentData.location || !assignmentData.date) {
        throw new Error('Title, location, and date are required');
      }

      // Validate partial vacation conflicts
      if (assignmentData.employees && assignmentData.employees.length > 0 &&
          assignmentData.fromTime && assignmentData.toTime && assignmentData.date) {
        
        const validationResult = validateEmployeeAvailability(
          assignmentData.employees,
          assignmentData.date,
          assignmentData.fromTime,
          assignmentData.toTime,
          employees,
          vacations
        );
        
        if (!validationResult.isValid) {
          toast({
            title: t('common.error'),
            description: t('planner.partialVacationConflict'),
            variant: 'destructive',
          });
          return false;
        }
      }

      console.log("Creating assignment with validation passed:", assignmentData);
      
      // Format car information for storage - handle both single car and multiple cars
      let carId = null;
      let carIds: string[] = [];
      
      if (assignmentData.cars && Array.isArray(assignmentData.cars) && assignmentData.cars.length > 0) {
        carIds = assignmentData.cars;
        carId = assignmentData.cars[0];
      } else if (assignmentData.car) {
        if (typeof assignmentData.car === 'string') {
          carId = assignmentData.car;
          carIds = [assignmentData.car];
        } else if (typeof assignmentData.car === 'object') {
          carId = assignmentData.car.id;
          carIds = [assignmentData.car.id];
        }
      }

      let responsibleUserId = null;
      if (assignmentData.responsibleUser) {
        if (typeof assignmentData.responsibleUser === 'string') {
          responsibleUserId = assignmentData.responsibleUser;
        } else if (typeof assignmentData.responsibleUser === 'object') {
          responsibleUserId = assignmentData.responsibleUser.id;
        }
      }
      
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
          car_ids: carIds.length > 0 ? carIds : null,
          responsible_user_id: responsibleUserId,
          published: assignmentData.published || false,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      
      // Link employees to assignment
      if (assignmentData.employees && assignmentData.employees.length > 0 && newAssignment?.id) {
        const employeeInserts = [];
        
        for (const employeeName of assignmentData.employees) {
          if (typeof employeeName !== 'string' || employeeName.trim() === '') {
            continue;
          }
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('name', employeeName.trim())
            .single();
            
          if (!profileError && profile?.id) {
            employeeInserts.push({
              assignment_id: newAssignment.id,
              user_id: profile.id
            });
          }
        }
        
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
      return true;
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      const errorMessage = error.message || t('planner.errorCreatingAssignment');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // Update assignment with validation
  const updateAssignment = async (id: string, assignmentData: Partial<Assignment>) => {
    try {
      // Validate partial vacation conflicts
      if (assignmentData.employees && assignmentData.employees.length > 0 &&
          assignmentData.fromTime && assignmentData.toTime && assignmentData.date) {
        
        const validationResult = validateEmployeeAvailability(
          assignmentData.employees,
          assignmentData.date,
          assignmentData.fromTime,
          assignmentData.toTime,
          employees,
          vacations
        );
        
        if (!validationResult.isValid) {
          toast({
            title: t('common.error'),
            description: t('planner.partialVacationConflict'),
            variant: 'destructive',
          });
          return false;
        }
      }

      console.log("Updating assignment with validation passed:", assignmentData);
      
      // Format car information for storage - handle both single car and multiple cars
      let carId = null;
      let carIds: string[] = [];
      
      if (assignmentData.cars && Array.isArray(assignmentData.cars) && assignmentData.cars.length > 0) {
        carIds = assignmentData.cars;
        carId = assignmentData.cars[0];
      } else if (assignmentData.car) {
        if (typeof assignmentData.car === 'string') {
          carId = assignmentData.car;
          carIds = [assignmentData.car];
        } else if (typeof assignmentData.car === 'object') {
          carId = assignmentData.car.id;
          carIds = [assignmentData.car.id];
        }
      }

      let responsibleUserId = null;
      if (assignmentData.responsibleUser) {
        if (typeof assignmentData.responsibleUser === 'string') {
          responsibleUserId = assignmentData.responsibleUser;
        } else if (typeof assignmentData.responsibleUser === 'object') {
          responsibleUserId = assignmentData.responsibleUser.id;
        }
      }
      
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
          car_ids: carIds.length > 0 ? carIds : null,
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
      
      // Link employees to assignment
      if (assignmentData.employees && assignmentData.employees.length > 0) {
        const employeeInserts = [];
        
        for (const employeeName of assignmentData.employees) {
          if (typeof employeeName !== 'string') {
            continue;
          }
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('name', employeeName)
            .single();
            
          if (!profileError && profile?.id) {
            employeeInserts.push({
              assignment_id: id,
              user_id: profile.id
            });
          }
        }
        
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
      
      fetchAssignments();
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
  };
  
  // Delete assignment
  const deleteAssignment = async (id: string) => {
    try {
      const { error: empError } = await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', id);
        
      if (empError) {
        console.error('Error deleting employee assignments:', empError);
      }
      
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

  // Publish single assignment
  const publishAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('planner.assignmentPublished'),
        description: t('planner.assignmentPublishedMsg'),
      });
      
      fetchAssignments();
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
  };

  // Publish assignments by date
  const publishAssignmentsByDate = async (date: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('assignment_date', date)
        .eq('published', false);

      if (error) throw error;
      
      toast({
        title: t('planner.dayPublished'),
        description: t('planner.dayPublishedMsg'),
      });
      
      fetchAssignments();
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
  };

  // Load assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);
  
  // Optimized realtime subscription with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(fetchAssignments, 300);
    };
    
    const channel = supabase
      .channel('assignment_changes_optimized')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        () => {
          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments_employees'
        },
        () => {
          debouncedRefresh();
        }
      )
      .subscribe();
      
    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [fetchAssignments]);

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
