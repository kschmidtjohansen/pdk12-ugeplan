
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
      
      console.log('[useOptimizedAssignments] Starting simple assignment fetch with filter:', filter, 'User role:', user.role);

      // Step 1: Get base assignments with simple query
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

      // Apply filtering based on context and user role
      switch (filter) {
        case 'user':
          // Dashboard context: Get user's assignments via assignments_employees
          console.log('[useOptimizedAssignments] Applying user filter for dashboard context');
          
          const { data: userAssignmentIds } = await supabase
            .from('assignments_employees')
            .select('assignment_id')
            .eq('user_id', user.id);
          
          const assignmentIds = userAssignmentIds?.map(ua => ua.assignment_id) || [];
          
          if (assignmentIds.length > 0) {
            baseQuery = baseQuery.or(`id.in.(${assignmentIds.join(',')}),responsible_user_id.eq.${user.id}`);
          } else {
            baseQuery = baseQuery.eq('responsible_user_id', user.id);
          }
          break;
          
        case 'all':
          // Planner context: Show based on user role
          if (user.role === 'servicemedarbejder') {
            console.log('[useOptimizedAssignments] Showing ALL published assignments for servicemedarbejder in planner');
            baseQuery = baseQuery.eq('published', true);
          } else {
            console.log('[useOptimizedAssignments] Showing all assignments for admin/skadeleder');
            // No additional filter - show everything
          }
          break;
          
        case 'published':
          console.log('[useOptimizedAssignments] Applying published filter');
          baseQuery = baseQuery.eq('published', true);
          break;
          
        case 'unpublished':
          console.log('[useOptimizedAssignments] Applying unpublished filter');
          baseQuery = baseQuery.eq('published', false);
          break;
      }

      const { data: assignmentsData, error: fetchError } = await baseQuery.order('assignment_date', { ascending: true });

      if (fetchError) {
        console.error('[useOptimizedAssignments] Assignment fetch error:', fetchError);
        throw fetchError;
      }

      console.log('[useOptimizedAssignments] Base assignments fetched:', assignmentsData?.length || 0);

      if (!assignmentsData) {
        setAssignments([]);
        return;
      }

      // Step 2: Get all assignment-employee relationships
      const assignmentIds = assignmentsData.map(a => a.id);
      let employeesData: any[] = [];
      
      if (assignmentIds.length > 0) {
        const { data: assignmentEmployees } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id')
          .in('assignment_id', assignmentIds);
        
        if (assignmentEmployees && assignmentEmployees.length > 0) {
          const userIds = [...new Set(assignmentEmployees.map(ae => ae.user_id))];
          
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', userIds);
          
          employeesData = assignmentEmployees.map(ae => ({
            assignment_id: ae.assignment_id,
            user_id: ae.user_id,
            profile: profiles?.find(p => p.id === ae.user_id)
          })).filter(item => item.profile);
        }
      }

      // Step 3: Get responsible users
      const responsibleUserIds = [...new Set(assignmentsData
        .map(a => a.responsible_user_id)
        .filter(Boolean))];
      
      let responsibleUsersData: any[] = [];
      if (responsibleUserIds.length > 0) {
        const { data: responsibleUsers } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', responsibleUserIds);
        
        responsibleUsersData = responsibleUsers || [];
      }

      // Step 4: Transform to Assignment format
      const finalAssignments: Assignment[] = assignmentsData.map(assignment => {
        // Get employees for this assignment
        const assignmentEmployees = employeesData
          .filter(emp => emp.assignment_id === assignment.id)
          .map(emp => emp.profile.name);

        // Get responsible user
        const responsibleUser = responsibleUsersData.find(ru => ru.id === assignment.responsible_user_id);

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          car: null, // Will be populated separately if needed
          cars: [],
          employees: assignmentEmployees,
          published: assignment.published || false,
          responsibleUser: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name
          } : null
        };
      });
      
      console.log('[useOptimizedAssignments] Final assignments processed:', finalAssignments.length);
      console.log('[useOptimizedAssignments] Filter applied:', filter, 'User role:', user.role);
      
      finalAssignments.forEach(assignment => {
        console.log(`[useOptimizedAssignments] Assignment: ${assignment.title} - Published: ${assignment.published} - Employees: [${assignment.employees.join(', ')}]`);
      });
      
      setAssignments(finalAssignments);
      
    } catch (err) {
      console.error('[useOptimizedAssignments] Critical error:', err);
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
      .channel('assignments_simplified_changes')
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
    operationStates,
    refetch: fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate,
  };
};
