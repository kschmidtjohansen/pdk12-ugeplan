
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
      
      console.log('[useAssignmentData] Raw assignments response:', assignmentsData);
      console.log('[useAssignmentData] Assignments count:', assignmentsData?.length || 0);
      
      if (assignmentsData) {
        // Get assignment-employee relationships
        const { data: assignmentEmployees, error: employeeError } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id');
        
        if (employeeError) throw employeeError;
        
        console.log('[useAssignmentData] Assignment employees response:', assignmentEmployees);
        console.log('[useAssignmentData] Assignment employees count:', assignmentEmployees?.length || 0);
        
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
        
        console.log('[useAssignmentData] Profiles response:', profilesData);
        console.log('[useAssignmentData] Profiles count:', profilesData?.length || 0);
        console.log('[useAssignmentData] Profile details:', profilesData.map(p => ({ id: p.id, name: p.name })));
        
        // Process and combine the data with enhanced debugging
        const processedAssignments = assignmentsData.map(assignment => {
          console.log(`[useAssignmentData] Processing assignment ${assignment.id} (${assignment.location}):`);
          
          // Find all employees for this assignment
          const assignmentEmployeeIds = assignmentEmployees
            ?.filter(emp => emp.assignment_id === assignment.id)
            ?.map(emp => emp.user_id) || [];
          
          console.log(`  - Employee IDs from junction table: [${assignmentEmployeeIds.join(', ')}]`);
          
          // Map employee IDs to names with proper validation and error handling
          const assignmentEmployeeNames: string[] = [];
          
          assignmentEmployeeIds.forEach(userId => {
            const profile = profilesData.find(p => p.id === userId);
            console.log(`    - Looking for user ${userId}, found profile:`, profile);
            
            if (profile?.name && typeof profile.name === 'string' && profile.name.trim() !== '') {
              assignmentEmployeeNames.push(profile.name.trim());
              console.log(`    - Added employee name: "${profile.name.trim()}"`);
            } else {
              console.log(`    - Skipped invalid employee name for user ${userId}:`, profile?.name);
            }
          });
          
          console.log(`  - Employee Names resolved: [${assignmentEmployeeNames.join(', ')}]`);
          console.log(`  - Final employee array length: ${assignmentEmployeeNames.length}`);
          console.log(`  - Published status: ${assignment.published}`);
          
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
            employees: assignmentEmployeeNames, // This is now guaranteed to be an array of valid strings
            published: assignment.published || false
          };
          
          console.log(`  - FINAL processed assignment:`, {
            id: processedAssignment.id,
            location: processedAssignment.location,
            employees: processedAssignment.employees,
            employeeCount: processedAssignment.employees.length,
            published: processedAssignment.published
          });
          
          return processedAssignment;
        });
        
        console.log('[useAssignmentData] ALL FINAL processed assignments summary:', processedAssignments.map(a => ({
          id: a.id,
          location: a.location,
          published: a.published,
          employees: a.employees,
          employeeCount: a.employees.length
        })));
        
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
  }, []);

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    setAssignments
  };
};
