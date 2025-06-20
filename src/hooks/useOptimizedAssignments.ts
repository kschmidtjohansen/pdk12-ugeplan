
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/integrations/supabase/types';

export type AssignmentFilter = 'all' | 'user' | 'published' | 'unpublished';

interface OptimizedAssignment extends Assignment {
  employees: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  cars: Array<{
    id: string;
    name: string;
    car_number: string;
  }>;
  responsible_user?: {
    id: string;
    name: string;
    email: string;
  };
}

export const useOptimizedAssignments = (filter: AssignmentFilter = 'all') => {
  const [assignments, setAssignments] = useState<OptimizedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchAssignments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useOptimizedAssignments] Fetching assignments with filter:', filter, 'User role:', user.role);

      // Build base query with all necessary joins
      let query = supabase
        .from('assignments')
        .select(`
          *,
          assignments_employees!inner(
            user_id,
            profiles!inner(
              id,
              name,
              email
            )
          ),
          cars(
            id,
            name,
            car_number
          ),
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name,
            email
          )
        `);

      // Apply filtering based on context and user role
      switch (filter) {
        case 'user':
          // Dashboard context: Show only assignments where user is assigned or responsible
          console.log('[useOptimizedAssignments] Applying user filter for dashboard context');
          query = query.or(`assignments_employees.user_id.eq.${user.id},responsible_user_id.eq.${user.id}`);
          break;
          
        case 'all':
          // Planner context: Show based on user role
          if (user.role === 'servicemedarbejder') {
            // For servicemedarbejder: Show ALL published assignments (not just their own)
            console.log('[useOptimizedAssignments] Applying published filter for servicemedarbejder in planner');
            query = query.eq('published', true);
          } else {
            // For admin/skadeleder: Show all assignments (published and unpublished)
            console.log('[useOptimizedAssignments] Showing all assignments for admin/skadeleder');
            // No additional filter - show everything
          }
          break;
          
        case 'published':
          console.log('[useOptimizedAssignments] Applying published filter');
          query = query.eq('published', true);
          break;
          
        case 'unpublished':
          console.log('[useOptimizedAssignments] Applying unpublished filter');
          query = query.eq('published', false);
          break;
      }

      const { data, error: fetchError } = await query.order('assignment_date', { ascending: true });

      if (fetchError) {
        console.error('[useOptimizedAssignments] Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('[useOptimizedAssignments] Raw data received:', data?.length || 0, 'assignments');

      if (!data) {
        setAssignments([]);
        return;
      }

      // Transform the data to group employees and cars properly
      const transformedAssignments: OptimizedAssignment[] = [];
      const assignmentMap = new Map<string, OptimizedAssignment>();

      data.forEach((row: any) => {
        const assignmentId = row.id;
        
        if (!assignmentMap.has(assignmentId)) {
          // Create new assignment entry
          const assignment: OptimizedAssignment = {
            ...row,
            employees: [],
            cars: row.cars ? (Array.isArray(row.cars) ? row.cars : [row.cars]) : [],
            responsible_user: row.responsible_user || undefined
          };
          assignmentMap.set(assignmentId, assignment);
          transformedAssignments.push(assignment);
        }

        const assignment = assignmentMap.get(assignmentId)!;
        
        // Add employee if not already added
        if (row.assignments_employees?.profiles) {
          const employee = {
            id: row.assignments_employees.profiles.id,
            name: row.assignments_employees.profiles.name,
            email: row.assignments_employees.profiles.email
          };
          
          const exists = assignment.employees.some(emp => emp.id === employee.id);
          if (!exists) {
            assignment.employees.push(employee);
          }
        }
      });

      console.log('[useOptimizedAssignments] Transformed assignments:', transformedAssignments.length);
      console.log('[useOptimizedAssignments] Sample assignment employees:', transformedAssignments[0]?.employees?.length || 0);

      setAssignments(transformedAssignments);
      
    } catch (err) {
      console.error('[useOptimizedAssignments] Error fetching assignments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: t('common.error'),
        description: t('assignments.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filter, user, toast, t]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchAssignments();

    const channel = supabase
      .channel('assignments_optimized_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        () => {
          console.log('[useOptimizedAssignments] Assignment change detected, refetching...');
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
          console.log('[useOptimizedAssignments] Assignment-employee relationship change detected, refetching...');
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAssignments]);

  // Memoized filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments;
  }, [assignments]);

  return {
    assignments: filteredAssignments,
    loading,
    error,
    refetch: fetchAssignments,
  };
};
