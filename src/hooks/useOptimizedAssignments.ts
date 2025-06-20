import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';

export type AssignmentFilter = 'all' | 'user' | 'published' | 'unpublished';

export const useOptimizedAssignments = (filter: AssignmentFilter = 'all') => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationStates, setOperationStates] = useState<Record<string, 'publishing' | 'deleting' | 'updating' | null>>({});
  
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
      
      console.log('[useOptimizedAssignments] FIXED - Starting optimized fetch with filter:', filter, 'User role:', user.role);

      // FIXED: Step 1 - Get base assignments with proper filtering
      let baseQuery = supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          type,
          published,
          created_at,
          updated_at,
          responsible_user_id
        `);

      // FIXED: Apply filtering based on context and user role
      switch (filter) {
        case 'user':
          // FIXED: Dashboard context - Get user's assignments via assignments_employees OR responsible_user_id
          console.log('[useOptimizedAssignments] FIXED - User filter: Getting user assignments for dashboard');
          
          // Get assignments where user is either assigned as employee OR responsible user
          const { data: userAssignmentIds } = await supabase
            .from('assignments_employees')
            .select('assignment_id')
            .eq('user_id', user.id);
          
          const assignmentIds = userAssignmentIds?.map(ua => ua.assignment_id) || [];
          
          if (assignmentIds.length > 0) {
            // User is assigned to some assignments OR is responsible user
            baseQuery = baseQuery.or(`id.in.(${assignmentIds.join(',')}),responsible_user_id.eq.${user.id}`);
          } else {
            // User is only responsible user, not assigned to any
            baseQuery = baseQuery.eq('responsible_user_id', user.id);
          }
          break;
          
        case 'all':
          // FIXED: Planner context - Show based on user role with correct logic
          if (user.role === 'servicemedarbejder') {
            console.log('[useOptimizedAssignments] FIXED - Planner: Showing ALL published assignments for servicemedarbejder');
            baseQuery = baseQuery.eq('published', true);
          } else {
            console.log('[useOptimizedAssignments] FIXED - Planner: Showing ALL assignments for admin/skadeleder');
            // No additional filter - admin/skadeleder see everything
          }
          break;
          
        case 'published':
          console.log('[useOptimizedAssignments] FIXED - Published filter applied');
          baseQuery = baseQuery.eq('published', true);
          break;
          
        case 'unpublished':
          console.log('[useOptimizedAssignments] FIXED - Unpublished filter applied');
          baseQuery = baseQuery.eq('published', false);
          break;
      }

      const { data: assignmentsData, error: fetchError } = await baseQuery.order('assignment_date', { ascending: true });

      if (fetchError) {
        console.error('[useOptimizedAssignments] FIXED - Assignment fetch error:', fetchError);
        throw fetchError;
      }

      console.log('[useOptimizedAssignments] FIXED - Base assignments fetched:', assignmentsData?.length || 0);

      if (!assignmentsData) {
        setAssignments([]);
        return;
      }

      // FIXED: Step 2 - Get ALL assignment-employee relationships with proper joins
      const assignmentIds = assignmentsData.map(a => a.id);
      let employeesData: any[] = [];
      
      if (assignmentIds.length > 0) {
        console.log('[useOptimizedAssignments] FIXED - Fetching employee relationships for', assignmentIds.length, 'assignments');
        
        // FIXED: Get assignment-employee relationships with user profiles in one optimized query
        const { data: assignmentEmployees, error: empError } = await supabase
          .from('assignments_employees')
          .select(`
            assignment_id,
            user_id,
            profiles:user_id (
              id,
              name,
              email
            )
          `)
          .in('assignment_id', assignmentIds);
        
        if (empError) {
          console.error('[useOptimizedAssignments] FIXED - Employee relationship fetch error:', empError);
        } else {
          employeesData = assignmentEmployees || [];
          console.log('[useOptimizedAssignments] FIXED - Employee relationships fetched:', employeesData.length);
        }
      }

      // FIXED: Step 3 - Get responsible users efficiently
      const responsibleUserIds = [...new Set(assignmentsData
        .map(a => a.responsible_user_id)
        .filter(Boolean))];
      
      let responsibleUsersData: any[] = [];
      if (responsibleUserIds.length > 0) {
        console.log('[useOptimizedAssignments] FIXED - Fetching responsible users:', responsibleUserIds.length);
        
        const { data: responsibleUsers, error: respError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', responsibleUserIds);
        
        if (respError) {
          console.error('[useOptimizedAssignments] FIXED - Responsible users fetch error:', respError);
        } else {
          responsibleUsersData = responsibleUsers || [];
          console.log('[useOptimizedAssignments] FIXED - Responsible users fetched:', responsibleUsersData.length);
        }
      }

      // FIXED: Step 4 - Transform to Assignment format with proper employee name extraction
      const finalAssignments: Assignment[] = assignmentsData.map(assignment => {
        // FIXED: Get ALL employees for this assignment (not just current user)
        const assignmentEmployees = employeesData
          .filter(emp => emp.assignment_id === assignment.id)
          .map(emp => {
            // FIXED: Handle nested profile data correctly
            if (emp.profiles && emp.profiles.name) {
              return emp.profiles.name;
            }
            return 'Unknown Employee';
          })
          .filter(name => name !== 'Unknown Employee'); // Filter out unknowns

        // FIXED: Get responsible user properly
        const responsibleUser = responsibleUsersData.find(ru => ru.id === assignment.responsible_user_id);

        const transformedAssignment = {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          car: null, // Will be populated separately if needed
          cars: [],
          employees: assignmentEmployees, // FIXED: All employee names, not just current user
          published: assignment.published || false,
          responsibleUser: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name
          } : null
        };

        return transformedAssignment;
      });
      
      console.log('[useOptimizedAssignments] FIXED - Final assignments processed:', finalAssignments.length);
      console.log('[useOptimizedAssignments] FIXED - Filter applied:', filter, 'User role:', user.role);
      
      // FIXED: Log assignment details for debugging
      finalAssignments.forEach(assignment => {
        console.log(`[useOptimizedAssignments] FIXED - Assignment: ${assignment.title} - Published: ${assignment.published} - Employees: [${assignment.employees.join(', ')}]`);
      });
      
      setAssignments(finalAssignments);
      
    } catch (err) {
      console.error('[useOptimizedAssignments] FIXED - Critical error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: t('common.error'),
        description: t('assignments.fetchError'),
        variant: 'destructive',
      });
      
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [filter, user, toast, t]);

  // Create assignment
  const createAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    try {
      console.log('[useOptimizedAssignments] Creating assignment:', assignmentData);
      
      const { data: newAssignment, error } = await supabase
        .from('assignments')
        .insert({
          title: assignmentData.title,
          description: assignmentData.description,
          location: assignmentData.location,
          assignment_date: assignmentData.date,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          published: assignmentData.published || false,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Handle employees
      if (assignmentData.employees && assignmentData.employees.length > 0 && newAssignment?.id) {
        for (const employeeName of assignmentData.employees) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('name', employeeName.trim())
            .single();
            
          if (profile?.id) {
            await supabase
              .from('assignments_employees')
              .insert({
                assignment_id: newAssignment.id,
                user_id: profile.id
              });
          }
        }
      }
      
      toast({
        title: t('planner.assignmentCreated'),
        description: t('planner.assignmentCreatedMsg', { title: assignmentData.title }),
      });
      
      fetchAssignments();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorCreatingAssignment'),
        variant: "destructive",
      });
    }
  }, [fetchAssignments, toast, t]);

  // Update assignment
  const updateAssignment = useCallback(async (id: string, assignmentData: Partial<Assignment>) => {
    try {
      setOperationStates(prev => ({ ...prev, [id]: 'updating' }));
      
      const { error } = await supabase
        .from('assignments')
        .update({
          title: assignmentData.title,
          description: assignmentData.description,
          location: assignmentData.location,
          assignment_date: assignmentData.date,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          published: false, // Always unpublish when editing
        })
        .eq('id', id);

      if (error) throw error;

      // Update employees
      await supabase.from('assignments_employees').delete().eq('assignment_id', id);
      
      if (assignmentData.employees && assignmentData.employees.length > 0) {
        for (const employeeName of assignmentData.employees) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('name', employeeName)
            .single();
            
          if (profile?.id) {
            await supabase
              .from('assignments_employees')
              .insert({
                assignment_id: id,
                user_id: profile.id
              });
          }
        }
      }
      
      toast({
        title: t('planner.assignmentUpdated'),
        description: t('planner.assignmentUpdatedMsg', { title: assignmentData.title }),
      });
      
      fetchAssignments();
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorUpdatingAssignment'),
        variant: "destructive",
      });
    } finally {
      setOperationStates(prev => ({ ...prev, [id]: null }));
    }
  }, [fetchAssignments, toast, t]);

  // Delete assignment
  const deleteAssignment = useCallback(async (id: string) => {
    try {
      setOperationStates(prev => ({ ...prev, [id]: 'deleting' }));
      
      await supabase.from('assignments_employees').delete().eq('assignment_id', id);
      const { error } = await supabase.from('assignments').delete().eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('planner.assignmentDeleted'),
        description: t('planner.assignmentDeletedMsg'),
      });
      
      fetchAssignments();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorDeletingAssignment'),
        variant: "destructive",
      });
    } finally {
      setOperationStates(prev => ({ ...prev, [id]: null }));
    }
  }, [fetchAssignments, toast, t]);

  // Publish assignment
  const publishAssignment = useCallback(async (id: string) => {
    try {
      setOperationStates(prev => ({ ...prev, [id]: 'publishing' }));
      
      const { error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('planner.assignmentPublished'),
        description: t('planner.assignmentPublishedMsg'),
      });
      
      fetchAssignments();
    } catch (error: any) {
      console.error('Error publishing assignment:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorPublishingAssignment'),
        variant: "destructive",
      });
    } finally {
      setOperationStates(prev => ({ ...prev, [id]: null }));
    }
  }, [fetchAssignments, toast, t]);

  // Publish assignments by date
  const publishAssignmentsByDate = useCallback(async (date: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('assignment_date', date)
        .eq('published', false);

      if (error) throw error;
      
      toast({
        title: t('planner.dayPublished'),
        description: t('planner.dayPublishedMsg'),
      });
      
      fetchAssignments();
    } catch (error: any) {
      console.error('Error publishing day:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorPublishingDay'),
        variant: "destructive",
      });
    }
  }, [fetchAssignments, toast, t]);

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
          console.log('[useOptimizedAssignments] FIXED - Assignment change detected, refetching...');
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
          console.log('[useOptimizedAssignments] FIXED - Assignment-employee relationship change detected, refetching...');
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
    operationStates,
    refetch: fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate,
  };
};
