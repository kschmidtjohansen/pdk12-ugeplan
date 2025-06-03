
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

  // Test Supabase connection and permissions
  const testConnectionAndPermissions = async () => {
    try {
      console.log('[useAssignmentData] Testing Supabase connection and permissions...');
      
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('assignments')
        .select('count')
        .limit(1);
      
      if (connectionError) {
        console.error('[useAssignmentData] Connection/Permission test failed:', connectionError);
        if (connectionError.code === 'PGRST116') {
          throw new Error('Permission denied: User cannot access assignments. Check RLS policies.');
        }
        if (connectionError.code === '42P01') {
          throw new Error('Database table not found. Check database setup.');
        }
        throw new Error(`Database error: ${connectionError.message} (Code: ${connectionError.code})`);
      }
      
      // Test user role access
      const { data: roleTest, error: roleError } = await supabase
        .rpc('get_current_user_role');
      
      if (roleError) {
        console.warn('[useAssignmentData] Could not get user role:', roleError);
      } else {
        console.log('[useAssignmentData] User role verified:', roleTest);
      }
      
      console.log('[useAssignmentData] Connection and permissions test successful');
      return true;
    } catch (err) {
      console.error('[useAssignmentData] Connection/Permission test exception:', err);
      throw err;
    }
  };

  // Fetch assignments from Supabase
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[useAssignmentData] STARTING FETCH for user: ${user?.name} (${user?.role}) - ID: ${user?.id}`);
      
      // Test connection and permissions first
      await testConnectionAndPermissions();
      
      // First, get all assignments with car information
      console.log('[useAssignmentData] Fetching assignments from database...');
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
      
      if (assignmentsError) {
        console.error('[useAssignmentData] Assignments fetch error:', assignmentsError);
        
        // Provide more specific error messages based on error codes
        if (assignmentsError.code === 'PGRST116') {
          throw new Error('Permission denied: You do not have access to view assignments. Contact your administrator.');
        }
        if (assignmentsError.code === '42P01') {
          throw new Error('Database configuration error: Assignments table not found.');
        }
        if (assignmentsError.code === 'PGRST301') {
          throw new Error('Authentication required: Please log in to view assignments.');
        }
        
        throw new Error(`Failed to fetch assignments: ${assignmentsError.message} (Code: ${assignmentsError.code || 'unknown'})`);
      }
      
      console.log(`[useAssignmentData] RAW ASSIGNMENTS FETCHED: ${assignmentsData?.length || 0} assignments`);
      console.log(`[useAssignmentData] Raw assignments:`, assignmentsData?.map(a => ({
        id: a.id,
        location: a.location,
        date: a.assignment_date,
        published: a.published
      })));
      
      if (assignmentsData) {
        // Get assignment-employee relationships
        console.log('[useAssignmentData] Fetching assignment-employee relationships...');
        const { data: assignmentEmployees, error: employeeError } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id');
        
        if (employeeError) {
          console.error('[useAssignmentData] Assignment employees fetch error:', employeeError);
          
          if (employeeError.code === 'PGRST116') {
            console.warn('[useAssignmentData] No permission to read assignment employees - continuing with empty employee data');
            // Continue with empty employee data rather than failing completely
          } else {
            throw new Error(`Failed to fetch assignment employees: ${employeeError.message}`);
          }
        }
        
        console.log(`[useAssignmentData] ASSIGNMENT-EMPLOYEE RELATIONSHIPS: ${assignmentEmployees?.length || 0} relationships`);
        console.log(`[useAssignmentData] Assignment employees:`, assignmentEmployees);
        
        // Get all profiles for the users in assignments
        const userIds = [...new Set(assignmentEmployees?.map(ae => ae.user_id) || [])];
        let profilesData: any[] = [];
        
        console.log(`[useAssignmentData] FETCHING PROFILES FOR ${userIds.length} unique users:`, userIds);
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
          
          if (profilesError) {
            console.error('[useAssignmentData] Profiles fetch error:', profilesError);
            
            if (profilesError.code === 'PGRST116') {
              console.warn('[useAssignmentData] No permission to read profiles - continuing with empty profile data');
              // Continue with empty profile data rather than failing completely
            } else {
              throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
            }
          } else {
            profilesData = profiles || [];
          }
        }
        
        console.log(`[useAssignmentData] PROFILES FETCHED: ${profilesData.length} profiles`);
        console.log(`[useAssignmentData] Profiles data:`, profilesData.map(p => ({ id: p.id, name: p.name })));
        
        // Process and combine the data with enhanced validation
        const processedAssignments = assignmentsData.map(assignment => {
          console.log(`[useAssignmentData] ===== PROCESSING ASSIGNMENT ${assignment.id} (${assignment.location}) =====`);
          
          // Find all employees for this assignment
          const assignmentEmployeeRelations = assignmentEmployees?.filter(emp => emp.assignment_id === assignment.id) || [];
          const assignmentEmployeeIds = assignmentEmployeeRelations.map(emp => emp.user_id);
          
          console.log(`[useAssignmentData] Assignment ${assignment.id} employee relations:`, assignmentEmployeeRelations);
          console.log(`[useAssignmentData] Assignment ${assignment.id} employee IDs:`, assignmentEmployeeIds);
          
          // Map employee IDs to names with validation
          const assignmentEmployeeNames: string[] = [];
          
          assignmentEmployeeIds.forEach(userId => {
            const profile = profilesData.find(p => p.id === userId);
            if (profile && profile.name) {
              assignmentEmployeeNames.push(profile.name);
              console.log(`[useAssignmentData] Added employee: ${profile.name} (ID: ${userId})`);
            } else {
              console.warn(`[useAssignmentData] WARNING: Profile not found for user ID: ${userId}`);
            }
          });
          
          // Ensure no duplicate names
          const uniqueEmployeeNames = [...new Set(assignmentEmployeeNames)];
          
          console.log(`[useAssignmentData] Assignment ${assignment.id} FINAL EMPLOYEE NAMES:`, uniqueEmployeeNames);
          console.log(`[useAssignmentData] Assignment ${assignment.id} published:`, assignment.published);
          
          const processedAssignment = {
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
            employees: uniqueEmployeeNames,
            published: assignment.published || false
          };
          
          console.log(`[useAssignmentData] Assignment ${assignment.id} FINAL PROCESSED:`, {
            id: processedAssignment.id,
            location: processedAssignment.location,
            employees: processedAssignment.employees,
            employeeCount: processedAssignment.employees.length,
            published: processedAssignment.published
          });
          
          return processedAssignment;
        });
        
        console.log(`[useAssignmentData] ===== FINAL SUMMARY FOR ${user?.name} (${user?.role}) =====`);
        console.log(`[useAssignmentData] Total processed assignments: ${processedAssignments.length}`);
        console.log(`[useAssignmentData] Assignments with employees:`, processedAssignments.filter(a => a.employees.length > 0).length);
        console.log(`[useAssignmentData] Published assignments:`, processedAssignments.filter(a => a.published).length);
        
        // Log each assignment's employee details
        processedAssignments.forEach(assignment => {
          if (assignment.employees.length > 0) {
            console.log(`[useAssignmentData] Assignment "${assignment.location}" (${assignment.id}): ${assignment.employees.join(', ')} (${assignment.employees.length} people)`);
          }
        });
        
        setAssignments(processedAssignments);
      } else {
        console.log('[useAssignmentData] No assignment data returned from database');
        setAssignments([]);
      }
    } catch (err) {
      console.error('[useAssignmentData] ERROR fetching assignments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Use appropriate error message based on error type
      let userErrorMessage = t('planner.fetchError') || 'Failed to load assignments. Please try again.';
      
      if (errorMessage.includes('Permission denied')) {
        userErrorMessage = 'Permission denied: You do not have access to view assignments. Contact your administrator.';
      } else if (errorMessage.includes('Authentication required')) {
        userErrorMessage = 'Please log in to view assignments.';
      } else if (errorMessage.includes('Database configuration error')) {
        userErrorMessage = 'System configuration error. Contact technical support.';
      }
      
      toast({
        title: t('common.error') || 'Error',
        description: userErrorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load assignments on component mount and when user changes
  useEffect(() => {
    if (user?.id) {
      console.log(`[useAssignmentData] User effect triggered - fetching for user: ${user.name} (${user.role})`);
      fetchAssignments();
    } else {
      console.log('[useAssignmentData] No user ID, skipping fetch');
      setLoading(false);
    }
  }, [user?.id, user?.role]);
  
  // Subscribe to assignment changes
  useEffect(() => {
    if (!user?.id) return;
    
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
