
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

  // Fetch assignments from Supabase - optimized for new RLS policies
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentData] Starting to fetch assignments with optimized queries...');
      
      // With the new standardized RLS policies, we can use more efficient queries
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
        `)
        .order('assignment_date', { ascending: true });
      
      if (assignmentsError) throw assignmentsError;
      
      console.log('[useAssignmentData] Assignments fetched:', assignmentsData?.length || 0);
      
      if (assignmentsData) {
        // Get assignment-employee relationships with optimized query
        const { data: assignmentEmployees, error: employeeError } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id')
          .order('assignment_id');
        
        if (employeeError) throw employeeError;
        
        console.log('[useAssignmentData] Assignment employees fetched:', assignmentEmployees?.length || 0);
        
        // Get all profiles for the users in assignments
        const userIds = assignmentEmployees?.map(ae => ae.user_id) || [];
        let profilesData: any[] = [];
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds)
            .order('name');
          
          if (profilesError) throw profilesError;
          profilesData = profiles || [];
        }
        
        console.log('[useAssignmentData] Profiles fetched:', profilesData?.length || 0);
        
        // Process and combine the data with enhanced performance
        const processedAssignments = assignmentsData.map(assignment => {
          console.log(`[useAssignmentData] Processing assignment ${assignment.id} (${assignment.location})`);
          
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
            published: assignment.published || false
          };
          
          return processedAssignment;
        });
        
        console.log('[useAssignmentData] Final processed assignments:', processedAssignments.length);
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
  }, []);
  
  // Subscribe to assignment changes with optimized realtime handling
  useEffect(() => {
    console.log('[useAssignmentData] Setting up optimized realtime subscriptions...');
    
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
      console.log('[useAssignmentData] Cleaning up realtime subscriptions');
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
