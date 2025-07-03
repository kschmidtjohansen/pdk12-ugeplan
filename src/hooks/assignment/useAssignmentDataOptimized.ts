
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
      
      console.log('[useAssignmentDataOptimized] TEAM FIX - Starting two-step fetch...');
      
      // TEAM FIX: First fetch assignments with responsible users
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
        console.error('[useAssignmentDataOptimized] TEAM FIX - Assignments fetch error:', assignmentsError);
        throw assignmentsError;
      }
      
      if (!assignments || assignments.length === 0) {
        console.log('[useAssignmentDataOptimized] TEAM FIX - No assignments found');
        setAssignments([]);
        return;
      }
      
      console.log(`[useAssignmentDataOptimized] TEAM FIX - Assignments fetched:`, assignments.length);
      
      // TEAM FIX: Then fetch all assignment-employee relationships
      const { data: assignmentEmployees, error: employeesError } = await supabase
        .from('assignments_employees')
        .select(`
          assignment_id,
          user_id,
          profiles(
            id,
            name,
            email
          )
        `);
      
      if (employeesError) {
        console.error('[useAssignmentDataOptimized] TEAM FIX - Employees fetch error:', employeesError);
        throw employeesError;
      }
      
      console.log(`[useAssignmentDataOptimized] TEAM FIX - Assignment employees fetched:`, assignmentEmployees?.length || 0);
      
      // TEAM FIX: Process and combine the data
      const transformedAssignments: Assignment[] = assignments.map(assignment => {
        // Find all employees for this assignment
        const employeesForAssignment = assignmentEmployees?.filter(ae => ae.assignment_id === assignment.id) || [];
        
        const assignedEmployees = employeesForAssignment.map(ae => ({
          id: ae.profiles?.id || ae.user_id,
          name: ae.profiles?.name || 'Unknown',
          email: ae.profiles?.email || 'unknown@example.com'
        })).filter(emp => emp.name !== 'Unknown');
        
        const employeeNames = assignedEmployees.map(emp => emp.name);
        
        // Handle responsible user data
        const responsibleUser = assignment.responsible_user ? {
          id: assignment.responsible_user.id,
          name: assignment.responsible_user.name,
          email: assignment.responsible_user.email
        } : null;
        
        console.log(`[useAssignmentDataOptimized] TEAM FIX - Assignment "${assignment.title}":`, {
          hasResponsibleUser: !!responsibleUser,
          responsibleUserName: responsibleUser?.name,
          responsibleUserId: responsibleUser?.id,
          employeeCount: employeeNames.length,
          employees: employeeNames,
          assignedEmployeesCount: assignedEmployees.length,
          assignedEmployeesNames: assignedEmployees.map(e => e.name),
          rawEmployeeData: employeesForAssignment,
          employeeUserIds: assignedEmployees.map(e => e.id),
          currentUserId: 'Will be shown in component filtering'
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
          assignedEmployees: assignedEmployees, // RACE CONDITION FIX: Complete employee data with IDs
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
