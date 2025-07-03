
import { useState, useEffect, useCallback } from 'react';
import { Assignment } from '@/types/assignment';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';

export const useAssignmentDataOptimized = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentDataOptimized] PHASE 2 FIX - Starting assignment fetch...');
      
      // PHASE 3 FIX: Enhanced query to get all assignment data with employee details
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name,
            email
          )
        `)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });
      
      if (assignmentsError) {
        console.error('[useAssignmentDataOptimized] PHASE 2 FIX - Assignment fetch error:', assignmentsError);
        throw assignmentsError;
      }
      
      console.log(`[useAssignmentDataOptimized] PHASE 2 FIX - Raw assignments fetched:`, assignments?.length || 0);
      
      if (!assignments || assignments.length === 0) {
        console.log('[useAssignmentDataOptimized] PHASE 2 FIX - No assignments found');
        setAssignments([]);
        return;
      }

      // PHASE 3 FIX: Get assignment employees and then fetch profile data separately
      const { data: assignmentEmployeesData, error: employeeError } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id');
      
      if (employeeError) {
        console.error('[useAssignmentDataOptimized] Employee fetch error:', employeeError);
        throw employeeError;
      }
      
      // Get all employee profiles
      const { data: employeeProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email');
      
      if (profilesError) {
        console.error('[useAssignmentDataOptimized] Profiles fetch error:', profilesError);
        throw profilesError;
      }
      
      
      // COMPREHENSIVE FIX: Enhanced assignment-employee mapping with detailed logging
      const employeeMap = new Map<string, { id: string; name: string; email: string }>();
      employeeProfiles?.forEach(profile => {
        employeeMap.set(profile.id, profile);
      });
      
      console.log(`[useAssignmentDataOptimized] COMPREHENSIVE FIX - Employee profiles available:`, employeeProfiles?.length || 0);
      console.log(`[useAssignmentDataOptimized] COMPREHENSIVE FIX - Assignment employees data:`, assignmentEmployeesData?.length || 0);
      
      const assignmentEmployeeMap = new Map<string, Array<{ id: string; name: string; email: string }>>();
      const assignmentEmployeeNameMap = new Map<string, string[]>();
      
      assignmentEmployeesData?.forEach(ae => {
        console.log(`[useAssignmentDataOptimized] COMPREHENSIVE FIX - Processing assignment employee:`, {
          assignmentId: ae.assignment_id,
          userId: ae.user_id
        });
        
        if (!assignmentEmployeeMap.has(ae.assignment_id)) {
          assignmentEmployeeMap.set(ae.assignment_id, []);
          assignmentEmployeeNameMap.set(ae.assignment_id, []);
        }
        
        const employee = employeeMap.get(ae.user_id);
        if (employee) {
          assignmentEmployeeMap.get(ae.assignment_id)!.push(employee);
          assignmentEmployeeNameMap.get(ae.assignment_id)!.push(employee.name);
          console.log(`[useAssignmentDataOptimized] COMPREHENSIVE FIX - Added employee to assignment:`, {
            assignmentId: ae.assignment_id,
            employeeName: employee.name
          });
        } else {
          console.warn(`[useAssignmentDataOptimized] COMPREHENSIVE FIX - Employee not found in profiles:`, ae.user_id);
        }
      });
      
      // PHASE 3 FIX: Transform assignments with enhanced employee and responsible user data
      const transformedAssignments: Assignment[] = assignments.map(assignment => {
        const employeeNames = assignmentEmployeeNameMap.get(assignment.id) || [];
        const assignedEmployees = assignmentEmployeeMap.get(assignment.id) || [];
        
        // PHASE 2 FIX: Properly handle responsible user data with enhanced validation
        const responsibleUser = assignment.responsible_user ? {
          id: assignment.responsible_user.id,
          name: assignment.responsible_user.name,
          email: assignment.responsible_user.email
        } : null;
        
        console.log(`[useAssignmentDataOptimized] COMPREHENSIVE FIX - Assignment "${assignment.title}":`, {
          hasResponsibleUser: !!responsibleUser,
          responsibleUserName: responsibleUser?.name,
          responsibleUserId: responsibleUser?.id,
          employeeCount: employeeNames.length,
          employees: employeeNames,
          assignedEmployeesCount: assignedEmployees.length,
          assignedEmployeesNames: assignedEmployees.map(e => e.name)
        });
        
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          employees: employeeNames, // Legacy format for backward compatibility
          assignedEmployees: assignedEmployees, // COMPREHENSIVE FIX: Full employee data with IDs for enhanced display
          cars: assignment.car_ids || (assignment.car_id ? [assignment.car_id] : []),
          car: assignment.car_id || (assignment.car_ids && assignment.car_ids.length > 0 ? assignment.car_ids[0] : ''),
          published: assignment.published || false,
          responsibleUser: responsibleUser, // Enhanced responsible user data
          responsibleUserId: assignment.responsible_user_id, // Add for compatibility
          type: assignment.type || 'other'
        };
      });
      
      console.log(`[useAssignmentDataOptimized] COMPREHENSIVE FIX - Final assignments with complete data:`, 
        transformedAssignments.map(a => ({ 
          title: a.title, 
          responsibleUser: a.responsibleUser?.name,
          employees: a.employees,
          employeeCount: a.employees?.length || 0,
          assignedEmployees: a.assignedEmployees?.map(e => e.name),
          assignedEmployeeCount: a.assignedEmployees?.length || 0
        })));
      
      setAssignments(transformedAssignments);
      
    } catch (err) {
      console.error('[useAssignmentDataOptimized] PHASE 2 FIX - Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignments';
      setError(errorMessage);
      
      toast({
        title: t('common.error') || 'Error',
        description: t('planner.fetchError') || 'Error loading assignments',
        variant: 'destructive',
      });
      
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  // Load assignments on mount
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('assignment_changes_optimized')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        console.log('[useAssignmentDataOptimized] Assignment change detected, refreshing...');
        fetchAssignments();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments_employees' }, () => {
        console.log('[useAssignmentDataOptimized] Assignment employee change detected, refreshing...');
        fetchAssignments();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAssignments]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments
  };
};
