import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from './useEmployees';
import { useVacations } from './useVacations';
import { cleanupAssignmentEmployees } from '@/utils/employeeAssignmentUtils';

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

  // Fetch assignments from Supabase with optimized single query
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentsConsolidated] Starting optimized assignment fetch...');
      
      // Single optimized query with all necessary joins
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
          )
        `)
        .order('assignment_date', { ascending: true });

      // Apply filter based on published status
      if (!includeUnpublished) {
        query = query.eq('published', true);
      }

      const { data: assignmentsData, error: assignmentsError } = await query;
      
      if (assignmentsError) throw assignmentsError;
      
      console.log('[useAssignmentsConsolidated] Fetched assignments:', assignmentsData?.length || 0);
      
      if (assignmentsData) {
        // Optimize employee relationship fetching with separate queries to avoid join issues
        const assignmentIds = assignmentsData.map(a => a.id);
        
        // First, get assignment-employee relationships
        const { data: assignmentEmployees, error: employeeError } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id')
          .in('assignment_id', assignmentIds);
        
        if (employeeError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[useAssignmentsConsolidated] Error fetching assignment employees:', employeeError);
          }
        }

        // Then, get the profile names for the user IDs
        let profileNames: Record<string, string> = {};
        if (assignmentEmployees && assignmentEmployees.length > 0) {
          const userIds = [...new Set(assignmentEmployees.map(ae => ae.user_id))];
          
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
          
          if (profileError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[useAssignmentsConsolidated] Error fetching profiles:', profileError);
            }
          } else if (profiles) {
            profileNames = profiles.reduce((acc, profile) => {
              acc[profile.id] = profile.name;
              return acc;
            }, {} as Record<string, string>);
          }
        }

        // Batch fetch car data for multiple cars
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
          
          if (carsError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[useAssignmentsConsolidated] Error fetching cars:', carsError);
            }
          } else {
            carsData = cars || [];
          }
        }
        
        // Create lookup maps for O(1) access instead of nested loops
        const employeesByAssignment = new Map<string, string[]>();
        if (assignmentEmployees) {
          assignmentEmployees.forEach(ae => {
            if (!employeesByAssignment.has(ae.assignment_id)) {
              employeesByAssignment.set(ae.assignment_id, []);
            }
            const employeeName = profileNames[ae.user_id];
            if (employeeName) {
              employeesByAssignment.get(ae.assignment_id)?.push(employeeName);
            }
          });
        }

        const carLookup = new Map(carsData.map(car => [car.id, car]));
        
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
          if (process.env.NODE_ENV === 'development') {
            console.log('[useAssignmentsConsolidated] Applied employee availability cleanup');
          }
        }
        
        setAssignments(cleanedAssignments);
        console.log('[useAssignmentsConsolidated] Optimized fetch completed:', cleanedAssignments.length, 'assignments');
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
  };

  // Create assignment with enhanced validation
  const createAssignment = async (assignmentData: Partial<Assignment>) => {
    try {
      // Validate required fields
      if (!assignmentData.title || !assignmentData.location || !assignmentData.date) {
        throw new Error('Title, location, and date are required');
      }

      console.log("Creating assignment with data:", assignmentData);
      
      // Format car information for storage - handle both single car and multiple cars
      let carId = null;
      let carIds: string[] = [];
      
      if (assignmentData.cars && Array.isArray(assignmentData.cars) && assignmentData.cars.length > 0) {
        // New format: multiple cars
        carIds = assignmentData.cars;
        carId = assignmentData.cars[0]; // Set first car as primary for backward compatibility
      } else if (assignmentData.car) {
        // Fallback: single car format
        if (typeof assignmentData.car === 'string') {
          carId = assignmentData.car;
          carIds = [assignmentData.car];
        } else if (typeof assignmentData.car === 'object') {
          carId = assignmentData.car.id;
          carIds = [assignmentData.car.id];
        }
      }

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
          car_id: carId, // Keep for backward compatibility
          car_ids: carIds.length > 0 ? carIds : null, // New field for multiple cars
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

  // Update assignment
  const updateAssignment = async (id: string, assignmentData: Partial<Assignment>) => {
    try {
      console.log("Updating assignment with data:", assignmentData);
      
      // Format car information for storage - handle both single car and multiple cars
      let carId = null;
      let carIds: string[] = [];
      
      if (assignmentData.cars && Array.isArray(assignmentData.cars) && assignmentData.cars.length > 0) {
        // New format: multiple cars
        carIds = assignmentData.cars;
        carId = assignmentData.cars[0]; // Set first car as primary for backward compatibility
      } else if (assignmentData.car) {
        // Fallback: single car format
        if (typeof assignmentData.car === 'string') {
          carId = assignmentData.car;
          carIds = [assignmentData.car];
        } else if (typeof assignmentData.car === 'object') {
          carId = assignmentData.car.id;
          carIds = [assignmentData.car.id];
        }
      }

      // Format responsible user ID
      let responsibleUserId = null;
      if (assignmentData.responsibleUser) {
        if (typeof assignmentData.responsibleUser === 'string') {
          responsibleUserId = assignmentData.responsibleUser;
        } else if (typeof assignmentData.responsibleUser === 'object') {
          responsibleUserId = assignmentData.responsibleUser.id;
        }
      }
      
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
          car_id: carId, // Keep for backward compatibility
          car_ids: carIds.length > 0 ? carIds : null, // New field for multiple cars
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
  }, []);
  
  // Refresh assignments when employees or vacations change (for auto-cleanup)
  useEffect(() => {
    if (employees.length > 0) {
      fetchAssignments();
    }
  }, [employees, vacations]);
  
  // Optimize realtime subscription with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('[useAssignmentsConsolidated] Debounced realtime refresh');
        fetchAssignments();
      }, 1000); // 1 second debounce
    };

    const channel = supabase
      .channel('assignment_changes_optimized_v2')
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
  }, []);

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
