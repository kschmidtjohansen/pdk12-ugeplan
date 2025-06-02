
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { safeProperty } from '@/utils/dbHelpers';

export const useAssignmentData = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch assignments from Supabase
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentData] Starting to fetch assignments...');
      
      // Get all assignments with car information
      const { data, error } = await supabase
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
          created_at,
          updated_at,
          cars:car_id (id, name, car_number)
        `);
      
      if (error) throw error;
      
      if (data) {
        console.log('[useAssignmentData] Fetched raw assignments:', data.length);
        
        // Now fetch the employees for each assignment with enhanced logging
        const assignmentsWithEmployees = await Promise.all(data.map(async (assignment) => {
          console.log(`[useAssignmentData] Processing assignment ${assignment.id} - ${assignment.location}`);
          
          // For each assignment, get associated employees
          try {
            const { data: employeeJoins, error: empJoinError } = await supabase
              .from('assignments_employees')
              .select('user_id')
              .eq('assignment_id', assignment.id);
              
            if (empJoinError) {
              throw empJoinError;
            }
            
            console.log(`[useAssignmentData] Assignment ${assignment.id} has ${employeeJoins?.length || 0} employee joins`);
            
            // Extract user IDs
            const userIds = employeeJoins?.map(join => join.user_id) || [];
            
            // Get employee names if there are user IDs
            let employeeNames: string[] = [];
            
            if (userIds.length > 0) {
              const { data: empData, error: empError } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', userIds);
                
              if (empError) {
                throw empError;
              }
              
              // Store complete employee names for consistent handling
              employeeNames = empData?.map(emp => emp.name) || [];
              console.log(`[useAssignmentData] Assignment ${assignment.id} (${assignment.location}) employees:`, employeeNames);
            } else {
              console.log(`[useAssignmentData] Assignment ${assignment.id} (${assignment.location}) has NO employees assigned`);
            }
            
            // Return formatted assignment with employee names
            const formattedAssignment = {
              id: assignment.id,
              title: assignment.title,
              description: assignment.description || '',
              date: assignment.assignment_date,
              fromTime: assignment.from_time,
              toTime: assignment.to_time,
              location: assignment.location,
              car: assignment.cars ? {
                id: assignment.cars.id,
                name: assignment.cars.name,
                car_number: assignment.cars.car_number
              } : null,
              employees: employeeNames,
              published: assignment.published || false
            };
            
            console.log(`[useAssignmentData] Final formatted assignment ${assignment.id}:`, {
              location: formattedAssignment.location,
              published: formattedAssignment.published,
              employeeCount: formattedAssignment.employees.length,
              employees: formattedAssignment.employees
            });
            
            return formattedAssignment;
          } catch (empError) {
            console.error(`[useAssignmentData] Error fetching employees for assignment ${assignment.id}:`, empError);
            // Return assignment without employees on error
            return {
              id: assignment.id,
              title: assignment.title,
              description: assignment.description || '',
              date: assignment.assignment_date,
              fromTime: assignment.from_time,
              toTime: assignment.to_time,
              location: assignment.location,
              car: assignment.cars ? {
                id: assignment.cars.id,
                name: assignment.cars.name,
                car_number: assignment.cars.car_number
              } : null,
              employees: [],
              published: assignment.published || false
            };
          }
        }));
        
        console.log('[useAssignmentData] Final processed assignments with employees:', assignmentsWithEmployees.length);
        console.log('[useAssignmentData] Assignment details:', assignmentsWithEmployees.map(a => ({
          id: a.id,
          location: a.location,
          published: a.published,
          employeeCount: a.employees.length,
          employees: a.employees
        })));
        
        setAssignments(assignmentsWithEmployees);
      }
    } catch (err) {
      console.error('[useAssignmentData] Error fetching assignments:', err);
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

  // Load assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, []);
  
  // Subscribe to assignment changes
  useEffect(() => {
    const channel = supabase
      .channel('assignment_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        () => {
          console.log('[useAssignmentData] Assignment table changed, refreshing...');
          fetchAssignments(); // Refresh when changes occur
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
          console.log('[useAssignmentData] Assignment employees table changed, refreshing...');
          fetchAssignments(); // Refresh when employee assignments change
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
    setAssignments
  };
};
