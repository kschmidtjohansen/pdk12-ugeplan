
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';

export type AssignmentFilter = 'all' | 'user' | 'published' | 'unpublished';

interface OptimizedAssignment {
  id: string;
  title: string;
  description: string;
  assignment_date: string;
  from_time: string;
  to_time: string;
  location: string;
  type: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  responsible_user_id: string | null;
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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationStates, setOperationStates] = useState<Record<string, 'publishing' | 'deleting' | 'updating' | null>>({});
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Transform OptimizedAssignment to Assignment
  const transformAssignment = (optimizedAssignment: OptimizedAssignment): Assignment => {
    return {
      id: optimizedAssignment.id,
      title: optimizedAssignment.title,
      description: optimizedAssignment.description,
      date: optimizedAssignment.assignment_date,
      fromTime: optimizedAssignment.from_time,
      toTime: optimizedAssignment.to_time,
      location: optimizedAssignment.location,
      car: optimizedAssignment.cars?.[0] ? {
        id: optimizedAssignment.cars[0].id,
        name: optimizedAssignment.cars[0].name
      } : null,
      cars: optimizedAssignment.cars?.map(car => car.id) || [],
      employees: optimizedAssignment.employees?.map(emp => emp.name) || [],
      published: optimizedAssignment.published,
      responsibleUser: optimizedAssignment.responsible_user ? {
        id: optimizedAssignment.responsible_user.id,
        name: optimizedAssignment.responsible_user.name
      } : null
    };
  };

  const fetchAssignments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useOptimizedAssignments] Fetching assignments with filter:', filter, 'User role:', user.role);

      // FIXED: Use proper LEFT JOIN syntax and correct foreign key relationships
      let query = supabase
        .from('assignments')
        .select(`
          *,
          assignments_employees(
            user_id,
            profiles(
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
          
          // Get user's assignment IDs first
          const { data: userAssignmentIds } = await supabase
            .from('assignments_employees')
            .select('assignment_id')
            .eq('user_id', user.id);
          
          const assignmentIds = userAssignmentIds?.map(ua => ua.assignment_id) || [];
          
          if (assignmentIds.length > 0) {
            query = query.or(`id.in.(${assignmentIds.join(',')}),responsible_user_id.eq.${user.id}`);
          } else {
            query = query.eq('responsible_user_id', user.id);
          }
          break;
          
        case 'all':
          // Planner context: Show based on user role
          if (user.role === 'servicemedarbejder') {
            // FIXED: For servicemedarbejder: Show ALL published assignments (not just their own)
            console.log('[useOptimizedAssignments] Showing ALL published assignments for servicemedarbejder in planner');
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

      // FIXED: Transform the data to handle optional employee relationships properly
      const transformedAssignments: OptimizedAssignment[] = [];
      const assignmentMap = new Map<string, OptimizedAssignment>();

      data.forEach((row: any) => {
        const assignmentId = row.id;
        
        if (!assignmentMap.has(assignmentId)) {
          // Create new assignment entry
          const assignment: OptimizedAssignment = {
            id: row.id,
            title: row.title,
            description: row.description,
            assignment_date: row.assignment_date,
            from_time: row.from_time,
            to_time: row.to_time,
            location: row.location,
            type: row.type,
            published: row.published,
            created_at: row.created_at,
            updated_at: row.updated_at,
            responsible_user_id: row.responsible_user_id,
            employees: [],
            cars: row.cars ? (Array.isArray(row.cars) ? row.cars : [row.cars]).filter(Boolean) : [],
            responsible_user: row.responsible_user || undefined
          };
          assignmentMap.set(assignmentId, assignment);
          transformedAssignments.push(assignment);
        }

        const assignment = assignmentMap.get(assignmentId)!;
        
        // FIXED: Handle employee relationships properly - they might be null/empty
        if (row.assignments_employees && Array.isArray(row.assignments_employees)) {
          row.assignments_employees.forEach((ae: any) => {
            if (ae?.profiles) {
              const employee = {
                id: ae.profiles.id,
                name: ae.profiles.name,
                email: ae.profiles.email
              };
              
              const exists = assignment.employees.some(emp => emp.id === employee.id);
              if (!exists) {
                assignment.employees.push(employee);
              }
            }
          });
        }
      });

      console.log('[useOptimizedAssignments] Transformed assignments:', transformedAssignments.length);
      console.log('[useOptimizedAssignments] Filter applied:', filter, 'User role:', user.role);
      
      // Convert to Assignment type for component compatibility
      const finalAssignments = transformedAssignments.map(transformAssignment);
      
      console.log('[useOptimizedAssignments] Final assignments for user:', finalAssignments.length);
      finalAssignments.forEach(assignment => {
        console.log(`[useOptimizedAssignments] Assignment: ${assignment.title} - Published: ${assignment.published} - Employees: [${assignment.employees.join(', ')}]`);
      });
      
      setAssignments(finalAssignments);
      
    } catch (err) {
      console.error('[useOptimizedAssignments] Error fetching assignments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // FIXED: Improved error handling
      if (errorMessage.includes('relation') || errorMessage.includes('foreign key')) {
        console.error('[useOptimizedAssignments] Database relationship error detected');
        toast({
          title: t('common.error'),
          description: 'Database relationship error. Please check your connection.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.error'),
          description: t('assignments.fetchError'),
          variant: 'destructive',
        });
      }
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
