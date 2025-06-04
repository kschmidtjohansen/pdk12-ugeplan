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

  // Fetch assignments from Supabase
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentsConsolidated] Starting to fetch assignments...');
      
      // Build the query with proper joins for car and responsible user data
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
        // Get assignment-employee relationships
        const { data: assignmentEmployees, error: employeeError } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id')
          .order('assignment_id');
        
        if (employeeError) {
          throw employeeError;
        }
        
        // Get all profiles for the users in assignments
        const userIds = assignmentEmployees?.map(ae => ae.user_id) || [];
        let profilesData: any[] = [];
        
        if (userIds.length > 0) {
          const uniqueUserIds = [...new Set(userIds)];
          
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', uniqueUserIds)
            .order('name');
          
          if (profilesError) {
            throw profilesError;
          }
          profilesData = profiles || [];
        }
        
        // Process and combine the data
        const processedAssignments = assignmentsData.map(assignment => {
          // Find all employees for this assignment
          const assignmentEmployeeIds = assignmentEmployees
            ?.filter(emp => emp.assignment_id === assignment.id)
            ?.map(emp => emp.user_id) || [];
          
          // Map employee IDs to names efficiently
          const assignmentEmployeeNames: string[] = [];
          
          assignmentEmployeeIds.forEach(userId => {
            const profile = profilesData.find(p => p.id === userId);
            if (profile?.name && typeof profile.name === 'string' && profile.name.trim() !== '') {
              assignmentEmployeeNames.push(profile.name.trim());
            }
          });
          
          const processedAssignment: Assignment = {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description || '',
            date: assignment.assignment_date,
            fromTime: assignment.from_time,
            toTime: assignment.to_time,
            location: assignment.location,
            car: assignment.cars ? {
              id: assignment.cars.id,
              name: assignment.cars.name
            } : null,
            employees: assignmentEmployeeNames,
            published: assignment.published || false,
            responsibleUser: assignment.responsible_user ? {
              id: assignment.responsible_user.id,
              name: assignment.responsible_user.name
            } : null
          };
          
          console.log('[useAssignmentsConsolidated] Processed assignment:', {
            id: processedAssignment.id,
            title: processedAssignment.title,
            car: processedAssignment.car,
            responsibleUser: processedAssignment.responsibleUser,
            employees: processedAssignment.employees
          });
          
          return processedAssignment;
        });
        
        // Clean up assignments by removing unavailable employees
        let cleanedAssignments = processedAssignments;
        if (employees.length > 0 && vacations.length >= 0) {
          cleanedAssignments = cleanupAssignmentEmployees(processedAssignments, employees, vacations);
          console.log('[useAssignmentsConsolidated] Applied employee availability cleanup');
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
  };

  // Create assignment
  const createAssignment = async (assignmentData: Partial<Assignment>) => {
    try {
      console.log("Creating assignment with data:", assignmentData);
      
      // Format car information for storage - handle multiple cars
      let carId = null;
      if (assignmentData.car) {
        if (typeof assignmentData.car === 'string') {
          carId = assignmentData.car;
        } else if (Array.isArray(assignmentData.car)) {
          carId = assignmentData.car.length > 0 ? assignmentData.car[0] : null;
        } else if (typeof assignmentData.car === 'object') {
          carId = assignmentData.car.id;
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
          car_id: carId,
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
      toast({
        title: t('common.error'),
        description: t('planner.errorCreatingAssignment'),
        variant: "destructive",
      });
    }
  };

  // Update assignment
  const updateAssignment = async (id: string, assignmentData: Partial<Assignment>) => {
    try {
      console.log("Updating assignment with data:", assignmentData);
      
      // Format car information for storage - handle multiple cars
      let carId = null;
      if (assignmentData.car) {
        if (typeof assignmentData.car === 'string') {
          carId = assignmentData.car;
        } else if (Array.isArray(assignmentData.car)) {
          carId = assignmentData.car.length > 0 ? assignmentData.car[0] : null;
        } else if (typeof assignmentData.car === 'object') {
          carId = assignmentData.car.id;
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
  
  // Subscribe to assignment changes with optimized realtime handling
  useEffect(() => {
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
          fetchAssignments();
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
          fetchAssignments();
        }
      )
      .subscribe();
      
    return () => {
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
