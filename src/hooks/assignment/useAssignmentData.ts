
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { safeProperty } from '@/utils/dbHelpers';
import { useAuth } from '@/context/AuthContext';

export const useAssignmentData = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch assignments from Supabase
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[useAssignmentData] Starting fetch for user: ${user?.name} (${user?.role})`);
      
      // First, get all assignments with car information
      const { data: assignmentsData, error: assignmentsError } = await supabase
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
      
      if (assignmentsError) throw assignmentsError;
      
      console.log(`[useAssignmentData] Raw assignments response (${assignmentsData?.length || 0} assignments):`, assignmentsData);
      
      if (assignmentsData) {
        // Get assignment-employee relationships
        const { data: assignmentEmployees, error: employeeError } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id');
        
        if (employeeError) throw employeeError;
        
        console.log(`[useAssignmentData] Assignment employees (${assignmentEmployees?.length || 0} relationships):`, assignmentEmployees);
        
        // Get all profiles for the users in assignments
        const userIds = assignmentEmployees?.map(ae => ae.user_id) || [];
        let profilesData: any[] = [];
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
          
          if (profilesError) throw profilesError;
          profilesData = profiles || [];
        }
        
        console.log(`[useAssignmentData] Profiles data (${profilesData.length} profiles):`, profilesData);
        
        // Process and combine the data with detailed logging
        const processedAssignments = assignmentsData.map(assignment => {
          // Find all employees for this assignment
          const assignmentEmployeeIds = assignmentEmployees
            ?.filter(emp => emp.assignment_id === assignment.id)
            ?.map(emp => emp.user_id) || [];
          
          const assignmentEmployeeNames = assignmentEmployeeIds
            .map(userId => {
              const profile = profilesData.find(p => p.id === userId);
              return profile?.name;
            })
            .filter(name => name) || [];
          
          console.log(`[useAssignmentData] Processing assignment ${assignment.id} (${assignment.location}):`, {
            assignmentEmployeeIds,
            assignmentEmployeeNames,
            published: assignment.published,
            date: assignment.assignment_date
          });
          
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
            employees: assignmentEmployeeNames,
            published: assignment.published || false
          };
        });
        
        console.log(`[useAssignmentData] Final processed assignments for ${user?.name} (${user?.role}):`, 
          processedAssignments.map(a => ({
            id: a.id,
            location: a.location,
            published: a.published,
            employees: a.employees,
            date: a.date
          }))
        );
        
        setAssignments(processedAssignments);
      } else {
        console.log('[useAssignmentData] No assignment data returned');
        setAssignments([]);
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
  }, [user?.id]); // Add user.id dependency to refetch when user changes
  
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
          console.log('[useAssignmentData] Assignment employees table changed, refreshing...');
          fetchAssignments();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    setAssignments
  };
};
