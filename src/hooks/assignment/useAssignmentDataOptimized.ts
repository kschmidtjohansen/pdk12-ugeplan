
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
      
      console.log('[useAssignmentDataOptimized] SINGLE QUERY FIX - Starting comprehensive fetch...');
      
      // SINGLE QUERY FIX: Use a single comprehensive query with explicit foreign key specification
      const { data: assignmentsWithEmployees, error: fetchError } = await supabase
        .from('assignments')
        .select(`
          *,
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name,
            email
          ),
          assignments_employees!assignments_employees_assignment_id_fkey(
            user_id,
            profiles(
              id,
              name,
              email
            )
          )
        `)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });
      
      if (fetchError) {
        console.error('[useAssignmentDataOptimized] SINGLE QUERY FIX - Fetch error:', fetchError);
        throw fetchError;
      }
      
      if (!assignmentsWithEmployees || assignmentsWithEmployees.length === 0) {
        console.log('[useAssignmentDataOptimized] SINGLE QUERY FIX - No assignments found');
        setAssignments([]);
        return;
      }
      
      console.log(`[useAssignmentDataOptimized] SINGLE QUERY FIX - Raw data fetched:`, assignmentsWithEmployees.length);
      console.log('[useAssignmentDataOptimized] SINGLE QUERY FIX - Sample raw assignment:', assignmentsWithEmployees[0]);
      
      // SINGLE QUERY FIX: Transform the comprehensive data
      const transformedAssignments: Assignment[] = assignmentsWithEmployees.map(assignment => {
        // Extract employee data from the nested structure
        const assignedEmployees = (assignment.assignments_employees || [])
          .map(ae => ({
            id: ae.profiles?.id || ae.user_id,
            name: ae.profiles?.name || 'Unknown',
            email: ae.profiles?.email || 'unknown@example.com'
          }))
          .filter(emp => emp.name && emp.name !== 'Unknown');
        
        const employeeNames = assignedEmployees.map(emp => emp.name);
        
        // Handle responsible user data
        const responsibleUser = assignment.responsible_user ? {
          id: assignment.responsible_user.id,
          name: assignment.responsible_user.name,
          email: assignment.responsible_user.email
        } : null;
        
        console.log(`[useAssignmentDataOptimized] SINGLE QUERY FIX - Assignment "${assignment.title}":`, {
          assignmentId: assignment.id,
          rawEmployeeData: assignment.assignments_employees,
          processedEmployees: assignedEmployees,
          employeeNames: employeeNames,
          employeeCount: employeeNames.length,
          responsibleUser: responsibleUser?.name,
          responsibleUserId: responsibleUser?.id
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
          assignedEmployees: assignedEmployees, // Complete employee data with IDs
          cars: assignment.car_ids || (assignment.car_id ? [assignment.car_id] : []),
          car: assignment.car_id || (assignment.car_ids && assignment.car_ids.length > 0 ? assignment.car_ids[0] : ''),
          published: assignment.published || false,
          responsibleUser: responsibleUser,
          responsibleUserId: assignment.responsible_user_id,
          type: assignment.type || 'other'
        };
      });
      
      console.log(`[useAssignmentDataOptimized] SINGLE QUERY FIX - Final transformed assignments:`, 
        transformedAssignments.map(a => ({ 
          title: a.title, 
          employeeCount: a.employees?.length || 0,
          employees: a.employees,
          assignedEmployeeCount: a.assignedEmployees?.length || 0,
          assignedEmployeeNames: a.assignedEmployees?.map(e => e.name)
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
