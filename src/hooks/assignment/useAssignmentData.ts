
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';

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
      
      // Fetch assignments with optimized query including responsible user
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
          responsible_user_id,
          created_at,
          updated_at,
          cars:car_id (id, name, car_number),
          responsible_user:responsible_user_id (id, name)
        `)
        .order('assignment_date', { ascending: true });
      
      if (assignmentsError) {
        console.error('[useAssignmentData] Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }
      
      console.log('[useAssignmentData] Fetched assignments:', assignmentsData?.length || 0);
      
      if (assignmentsData) {
        // Get assignment-employee relationships
        const { data: assignmentEmployees, error: employeeError } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id')
          .order('assignment_id');
        
        if (employeeError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[useAssignmentData] Error fetching assignment employees:', employeeError);
          }
          // Don't throw, continue with empty employee assignments
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
            if (process.env.NODE_ENV === 'development') {
              console.warn('[useAssignmentData] Error fetching profiles for assignments:', profilesError);
            }
            // Don't throw, continue with empty profiles
          } else {
            profilesData = profiles || [];
          }
        }
        
        // Process and combine the data
        const processedAssignments = assignmentsData.map(assignment => {
          // Find all employees for this assignment
          const assignmentEmployeeIds = assignmentEmployees
            ?.filter(emp => emp.assignment_id === assignment.id)
            ?.map(emp => emp.user_id) || [];
          
          // Map employee IDs to names efficiently with validation
          const assignmentEmployeeNames: string[] = [];
          
          assignmentEmployeeIds.forEach(userId => {
            const profile = profilesData.find(p => p.id === userId);
            if (profile?.name && typeof profile.name === 'string' && profile.name.trim() !== '') {
              assignmentEmployeeNames.push(profile.name.trim());
            } else if (process.env.NODE_ENV === 'development') {
              console.warn('[useAssignmentData] Invalid employee name for user:', userId, profile);
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
          
          return processedAssignment;
        });
        
        console.log('[useAssignmentData] Processed assignments:', processedAssignments.length);
        setAssignments(processedAssignments);
      } else {
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
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Load assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, []);
  
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
        (payload) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useAssignmentData] Received assignment change:', payload);
          }
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
        (payload) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useAssignmentData] Received assignment employee change:', payload);
          }
          fetchAssignments();
        }
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useAssignmentData] Subscription status:', status);
        }
      });
      
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
