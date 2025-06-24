
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { OptimizedAssignmentService } from '@/services/optimizedAssignmentService';

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
      
      console.log('[useOptimizedAssignments] RESET APPROACH - Starting fetch:', { filter, userName: user.name, userRole: user.role });

      // Use the fixed OptimizedAssignmentService
      const optimizedData = await OptimizedAssignmentService.fetchAssignmentsWithFilter(
        filter, 
        user.id, 
        user.role
      );

      console.log('[useOptimizedAssignments] RESET APPROACH - Received data:', optimizedData.length, 'assignments');

      // Transform OptimizedAssignmentData to Assignment format - PRESERVE ALL EMPLOYEE NAMES
      const finalAssignments: Assignment[] = optimizedData.map(assignment => {
        // CRITICAL FIX: Extract ALL employee names without any filtering
        const employeeNames = assignment.employees.map(emp => emp.name);
        
        console.log(`[useOptimizedAssignments] RESET APPROACH - Assignment "${assignment.title}" employees:`, employeeNames);
        
        // Special logging for Asbestkursus
        if (assignment.title.includes('Asbestkursus') || assignment.title.includes('asbestkursus')) {
          console.log(`[useOptimizedAssignments] RESET APPROACH - ASBESTKURSUS TRANSFORMATION:`, {
            title: assignment.title,
            employees: employeeNames,
            employeeCount: employeeNames.length,
            originalEmployees: assignment.employees
          });
        }

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          car: null, // Simplified for now
          cars: [],
          employees: employeeNames, // CRITICAL: ALL employee names preserved here
          published: assignment.published || false,
          responsibleUser: assignment.responsible_user ? {
            id: assignment.responsible_user.id,
            name: assignment.responsible_user.name
          } : null
        };
      });
      
      console.log('[useOptimizedAssignments] RESET APPROACH - Final transformation complete:', {
        userRole: user.role,
        totalAssignments: finalAssignments.length,
        filter: filter,
        sampleAssignments: finalAssignments.slice(0, 3).map(a => ({ 
          title: a.title, 
          employees: a.employees,
          employeeCount: a.employees.length,
          published: a.published 
        }))
      });
      
      setAssignments(finalAssignments);
      
    } catch (err) {
      console.error('[useOptimizedAssignments] RESET APPROACH - Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: t('common.error'),
        description: t('planner.fetchError'),
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
          car_ids: assignmentData.cars || [],
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
          published: false,
          car_ids: assignmentData.cars || [],
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
      .channel('assignments_reset_approach')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        () => {
          console.log('[useOptimizedAssignments] RESET APPROACH - Assignment change detected, refetching...');
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
          console.log('[useOptimizedAssignments] RESET APPROACH - Assignment-employee relationship change detected, refetching...');
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
    createAssignment: useCallback(async (assignmentData: Partial<Assignment>) => {
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
            car_ids: assignmentData.cars || [],
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
    }, [fetchAssignments, toast, t]),
    updateAssignment: useCallback(async (id: string, assignmentData: Partial<Assignment>) => {
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
            published: false,
            car_ids: assignmentData.cars || [],
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
    }, [fetchAssignments, toast, t]),
    deleteAssignment: useCallback(async (id: string) => {
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
    }, [fetchAssignments, toast, t]),
    publishAssignment: useCallback(async (id: string) => {
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
    }, [fetchAssignments, toast, t]),
    publishAssignmentsByDate: useCallback(async (date: string) => {
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
    }, [fetchAssignments, toast, t]),
  };
};
