
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
      
      console.log('[useAssignmentDataOptimized] SAGSANSVARLIG FIX - Starting assignment fetch...');
      
      // CRITICAL FIX: Use the correct foreign key constraint name from the database
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
        console.error('[useAssignmentDataOptimized] SAGSANSVARLIG FIX - Assignment fetch error:', assignmentsError);
        throw assignmentsError;
      }
      
      console.log(`[useAssignmentDataOptimized] SAGSANSVARLIG FIX - Raw assignments fetched:`, assignments?.length || 0);
      
      if (!assignments || assignments.length === 0) {
        console.log('[useAssignmentDataOptimized] SAGSANSVARLIG FIX - No assignments found');
        setAssignments([]);
        return;
      }

      // Get all unique employee IDs from assignments_employees table
      const { data: assignmentEmployees, error: employeeError } = await supabase
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
      
      // Create lookup maps
      const employeeMap = new Map<string, { id: string; name: string; email: string }>();
      employeeProfiles?.forEach(profile => {
        employeeMap.set(profile.id, profile);
      });
      
      const assignmentEmployeeMap = new Map<string, string[]>();
      assignmentEmployees?.forEach(ae => {
        if (!assignmentEmployeeMap.has(ae.assignment_id)) {
          assignmentEmployeeMap.set(ae.assignment_id, []);
        }
        const employee = employeeMap.get(ae.user_id);
        if (employee) {
          assignmentEmployeeMap.get(ae.assignment_id)!.push(employee.name);
        }
      });
      
      // Transform assignments
      const transformedAssignments: Assignment[] = assignments.map(assignment => {
        const employeeNames = assignmentEmployeeMap.get(assignment.id) || [];
        
        // CRITICAL FIX: Properly handle responsible user data
        const responsibleUser = assignment.responsible_user ? {
          id: assignment.responsible_user.id,
          name: assignment.responsible_user.name,
          email: assignment.responsible_user.email
        } : null;
        
        console.log(`[useAssignmentDataOptimized] SAGSANSVARLIG FIX - Assignment "${assignment.title}":`, {
          hasResponsibleUser: !!responsibleUser,
          responsibleUserName: responsibleUser?.name,
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
          employees: employeeNames,
          cars: assignment.car_ids || (assignment.car_id ? [assignment.car_id] : []),
          car: assignment.car_id || (assignment.car_ids && assignment.car_ids.length > 0 ? assignment.car_ids[0] : ''),
          published: assignment.published || false,
          responsibleUser: responsibleUser, // CRITICAL: This should now contain proper data
          type: assignment.type || 'other'
        };
      });
      
      console.log(`[useAssignmentDataOptimized] SAGSANSVARLIG FIX - Final assignments with responsible users:`, 
        transformedAssignments.filter(a => a.responsibleUser).map(a => ({ 
          title: a.title, 
          responsibleUser: a.responsibleUser?.name 
        })));
      
      setAssignments(transformedAssignments);
      
    } catch (err) {
      console.error('[useAssignmentDataOptimized] SAGSANSVARLIG FIX - Error:', err);
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
