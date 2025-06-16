import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';

interface UseAssignmentsOptimizedProps {
  filter?: 'all' | 'dashboard' | 'planner';
  includeUnpublished?: boolean;
}

export const useAssignmentsOptimized = ({ 
  filter = 'all', 
  includeUnpublished = true 
}: UseAssignmentsOptimizedProps = {}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const isFetchingRef = useRef(false);

  // Fetch assignments with simplified queries
  const fetchAssignments = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('[useAssignmentsOptimized] Fetch already in progress, skipping...');
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentsOptimized] Starting fetch...');
      
      // Step 1: Fetch basic assignments data
      let assignmentsQuery = supabase
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
          updated_at
        `)
        .order('assignment_date', { ascending: true });

      if (!includeUnpublished) {
        assignmentsQuery = assignmentsQuery.eq('published', true);
      }

      const { data: assignmentsData, error: assignmentsError } = await assignmentsQuery;
      
      if (assignmentsError) {
        throw new Error(`Assignments fetch error: ${assignmentsError.message}`);
      }
      
      console.log('[useAssignmentsOptimized] Fetched assignments:', assignmentsData?.length || 0);
      
      if (!assignmentsData || assignmentsData.length === 0) {
        setAssignments([]);
        return;
      }

      // Step 2: Fetch employee assignments
      const assignmentIds = assignmentsData.map(a => a.id);
      const { data: employeeAssignments, error: empError } = await supabase
        .from('assignments_employees')
        .select(`
          assignment_id,
          user_id
        `)
        .in('assignment_id', assignmentIds);

      if (empError) {
        console.warn('[useAssignmentsOptimized] Employee assignments fetch error:', empError);
      }

      // Step 3: Get profiles for employee assignments
      const userIds = employeeAssignments?.map(emp => emp.user_id) || [];
      const uniqueUserIds = [...new Set(userIds)];

      let profilesData: any[] = [];
      if (uniqueUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uniqueUserIds);
        
        if (profilesError) {
          console.warn('[useAssignmentsOptimized] Profiles fetch error:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      // Step 4: Fetch car data
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
        
        if (!carsError && cars) {
          carsData = cars;
        }
      }

      // Step 5: Fetch responsible users
      const responsibleUserIds = assignmentsData
        .filter(a => a.responsible_user_id)
        .map(a => a.responsible_user_id);

      let responsibleUsers: any[] = [];
      if (responsibleUserIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', responsibleUserIds);
        
        if (!usersError && users) {
          responsibleUsers = users;
        }
      }
      
      // Step 6: Process and combine the data
      const processedAssignments = assignmentsData.map(assignment => {
        // Extract employee names
        const assignmentEmployees = employeeAssignments?.filter(
          emp => emp.assignment_id === assignment.id
        ) || [];
        
        const employeeNames = assignmentEmployees
          .map(emp => {
            const profile = profilesData.find(p => p.id === emp.user_id);
            return profile?.name;
          })
          .filter(name => name && typeof name === 'string')
          .map(name => name.trim());

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

        // Handle responsible user
        const responsibleUser = assignment.responsible_user_id 
          ? responsibleUsers.find(u => u.id === assignment.responsible_user_id)
          : null;
        
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
          employees: employeeNames,
          published: assignment.published || false,
          responsibleUser: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name
          } : null
        };
        
        return processedAssignment;
      });
      
      console.log('[useAssignmentsOptimized] Processed assignments:', processedAssignments.length);
      setAssignments(processedAssignments);
      
    } catch (err) {
      console.error('[useAssignmentsOptimized] Error fetching assignments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignments';
      setError(errorMessage);
      
      toast({
        title: t('common.error'),
        description: t('planner.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [includeUnpublished, toast, t]);

  // Create assignment
  const createAssignment = async (assignmentData: Partial<Assignment>) => {
    try {
      // Validate required fields
      if (!assignmentData.title || !assignmentData.location || !assignmentData.date) {
        throw new Error('Title, location, and date are required');
      }

      console.log("Creating assignment:", assignmentData);
      
      // Format car information for storage
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

  // Update assignment
  const updateAssignment = async (id: string, assignmentData: Partial<Assignment>) => {
    try {
      console.log("Updating assignment:", assignmentData);
      
      // Format car information for storage
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

  // Load assignments on component mount - only once
  useEffect(() => {
    console.log('[useAssignmentsOptimized] Initial fetch effect triggered');
    fetchAssignments();
  }, []); // Empty dependency array - only run once on mount

  // Simplified realtime subscription with better cleanup
  useEffect(() => {
    let isSubscribed = true;
    
    const handleRealtimeChange = () => {
      if (isSubscribed && !isFetchingRef.current) {
        console.log('[useAssignmentsOptimized] Realtime change detected, refetching...');
        setTimeout(() => fetchAssignments(), 300); // Debounced
      }
    };
    
    const channel = supabase
      .channel('assignments_optimized')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        handleRealtimeChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments_employees'
        },
        handleRealtimeChange
      )
      .subscribe();
      
    return () => {
      isSubscribed = false;
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
    publishAssignmentsByDate
  };
};
