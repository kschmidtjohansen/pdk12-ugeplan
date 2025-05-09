
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
          cars:car_id (name)
        `);
      
      if (error) throw error;
      
      if (data) {
        // Now fetch the employees for each assignment
        const assignmentsWithEmployees = await Promise.all(data.map(async (assignment) => {
          const { data: employeesData, error: empError } = await supabase
            .from('assignments_employees')
            .select(`
              profiles:user_id (name)
            `)
            .eq('assignment_id', assignment.id);
          
          if (empError) {
            console.error('Error fetching employees for assignment:', empError);
            return {
              id: assignment.id,
              title: assignment.title,
              description: assignment.description || '',
              date: assignment.assignment_date, // Map from assignment_date to date
              fromTime: assignment.from_time, // Map from from_time to fromTime
              toTime: assignment.to_time, // Map from to_time to toTime
              location: assignment.location,
              car: safeProperty(assignment.cars, 'name', ''),
              employees: [],
              published: assignment.published || false
            };
          }
          
          // Extract employee names from the join result and handle possible null values
          const employeeNames = employeesData?.map(emp => {
            // Handle the case where `profiles` might be an error object
            return safeProperty(emp.profiles, 'name', '');
          }) || [];
          
          // Return formatted assignment with employee names
          return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description || '',
            date: assignment.assignment_date, // Map from assignment_date to date
            fromTime: assignment.from_time, // Map from from_time to fromTime
            toTime: assignment.to_time, // Map from to_time to toTime
            location: assignment.location,
            car: safeProperty(assignment.cars, 'name', ''),
            employees: employeeNames.filter(Boolean), // Filter out empty names
            published: assignment.published || false
          };
        }));
        
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

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    setAssignments
  };
};
