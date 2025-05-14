
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/useToast';
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
        console.log("Fetched assignments data:", data);
        
        // Now fetch the employees for each assignment
        const assignmentsWithEmployees = await Promise.all(data.map(async (assignment) => {
          try {
            const { data: employeeJoins, error: empJoinError } = await supabase
              .from('assignments_employees')
              .select('user_id')
              .eq('assignment_id', assignment.id);
              
            if (empJoinError) {
              throw empJoinError;
            }
            
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
            }
            
            // Return formatted assignment with employee names
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
              employees: employeeNames,
              published: assignment.published || false
            };
          } catch (empError) {
            console.error('Error fetching employees for assignment:', empError);
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
        
        console.log("Processed assignments with employees:", assignmentsWithEmployees);
        setAssignments(assignmentsWithEmployees);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
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
          fetchAssignments(); // Refresh when employee assignments change
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Memoize sorted assignments by date to prevent unnecessary re-renders
  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => {
      // Sort by date first
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      
      // If same date, sort by time
      if (dateDiff === 0) {
        // Convert time strings to comparable values
        const aTime = a.fromTime.replace(':', '');
        const bTime = b.fromTime.replace(':', '');
        return parseInt(aTime) - parseInt(bTime);
      }
      
      return dateDiff;
    });
  }, [assignments]);

  return {
    assignments: sortedAssignments,
    loading,
    error,
    fetchAssignments,
    setAssignments
  };
};
