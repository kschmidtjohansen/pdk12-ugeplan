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
      
      console.log('[useOptimizedAssignments] OPTIMIZED - Starting fetch with filter:', filter, 'User role:', user.role);

      // OPTIMIZED: Single query with proper foreign key joins
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
          responsible_user_id,
          car_id,
          car_ids,
          assignments_employees(
            user_id,
            profiles(
              id,
              name,
              email
            )
          ),
          responsible_user:profiles!assignments_responsible_user_id_fkey(
            id,
            name,
            email
          ),
          car:cars!assignments_car_id_fkey(
            id,
            name,
            car_number
          )
        `);

      // Apply filtering based on context and user role
      switch (filter) {
        case 'user':
          // Dashboard context - Get user's assignments via assignments_employees OR responsible_user_id
          console.log('[useOptimizedAssignments] OPTIMIZED - User filter: Getting user assignments for dashboard');
          
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
          // Planner context - Show based on user role
          if (user.role === 'servicemedarbejder') {
            console.log('[useOptimizedAssignments] OPTIMIZED - Planner: Showing ALL published assignments for servicemedarbejder');
            baseQuery = baseQuery.eq('published', true);
          } else {
            console.log('[useOptimizedAssignments] OPTIMIZED - Planner: Showing ALL assignments for admin/skadeleder');
            // No additional filter - admin/skadeleder see everything
          }
          break;
          
        case 'published':
          console.log('[useOptimizedAssignments] OPTIMIZED - Published filter applied');
          baseQuery = baseQuery.eq('published', true);
          break;
          
        case 'unpublished':
          console.log('[useOptimizedAssignments] OPTIMIZED - Unpublished filter applied');
          baseQuery = baseQuery.eq('published', false);
          break;
      }

      const { data: assignmentsData, error: fetchError } = await baseQuery.order('assignment_date', { ascending: true });

      if (fetchError) {
        console.error('[useOptimizedAssignments] OPTIMIZED - Assignment fetch error:', fetchError);
        throw fetchError;
      }

      console.log('[useOptimizedAssignments] OPTIMIZED - Raw assignments fetched:', assignmentsData?.length || 0);

      if (!assignmentsData || assignmentsData.length === 0) {
        setAssignments([]);
        return;
      }

      // OPTIMIZED: Get additional car data for multiple cars efficiently
      const allCarIds = new Set<string>();
      assignmentsData.forEach(assignment => {
        if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
          assignment.car_ids.forEach((carId: string) => allCarIds.add(carId));
        }
      });

      let additionalCarsData: any[] = [];
      if (allCarIds.size > 0) {
        console.log('[useOptimizedAssignments] OPTIMIZED - Fetching additional car data for:', Array.from(allCarIds));
        
        const { data: cars, error: carsError } = await supabase
          .from('cars')
          .select('id, name, car_number')
          .in('id', Array.from(allCarIds));
        
        if (carsError) {
          console.warn('[useOptimizedAssignments] OPTIMIZED - Additional cars fetch warning:', carsError);
        } else {
          additionalCarsData = cars || [];
          console.log('[useOptimizedAssignments] OPTIMIZED - Additional cars fetched:', additionalCarsData.length);
        }
      }

      // OPTIMIZED: Transform to Assignment format with native joins
      const finalAssignments: Assignment[] = assignmentsData.map(assignment => {
        // OPTIMIZED: Extract employee names from the joined data
        const employeeNames = assignment.assignments_employees
          ?.map((emp: any) => emp.profiles?.name)
          .filter(name => name && typeof name === 'string')
          .map(name => name.trim()) || [];
        
        console.log(`[useOptimizedAssignments] OPTIMIZED - Assignment ${assignment.id} employees:`, employeeNames);

        // OPTIMIZED: Handle car data - both legacy and new formats
        let carData = null;
        let carsArray: string[] = [];
        
        if (assignment.car_ids && Array.isArray(assignment.car_ids) && assignment.car_ids.length > 0) {
          // New format: multiple cars
          carsArray = assignment.car_ids;
          const firstCar = additionalCarsData.find(c => c.id === assignment.car_ids[0]) || assignment.car;
          if (firstCar) {
            carData = { id: firstCar.id, name: firstCar.name };
          }
        } else if (assignment.car_id && assignment.car) {
          // Legacy format: single car with joined data
          carsArray = [assignment.car_id];
          carData = { id: assignment.car.id, name: assignment.car.name };
        }

        const transformedAssignment = {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          car: carData,
          cars: carsArray,
          employees: employeeNames, // OPTIMIZED: Now properly extracted from joins
          published: assignment.published || false,
          responsibleUser: assignment.responsible_user ? {
            id: assignment.responsible_user.id,
            name: assignment.responsible_user.name
          } : null
        };

        return transformedAssignment;
      });
      
      console.log('[useOptimizedAssignments] OPTIMIZED - Final assignments processed:', finalAssignments.length);
      console.log('[useOptimizedAssignments] OPTIMIZED - Filter applied:', filter, 'User role:', user.role);
      
      // Log assignment details for debugging
      finalAssignments.forEach(assignment => {
        console.log(`[useOptimizedAssignments] OPTIMIZED - Assignment: ${assignment.title} - Published: ${assignment.published} - Employees: [${assignment.employees.join(', ')}] - Cars: [${assignment.cars.join(', ')}]`);
      });
      
      setAssignments(finalAssignments);
      
    } catch (err) {
      console.error('[useOptimizedAssignments] OPTIMIZED - Critical error:', err);
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
          published: false, // Always unpublish when editing
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
      .channel('assignments_optimized_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        () => {
          console.log('[useOptimizedAssignments] OPTIMIZED - Assignment change detected, refetching...');
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
          console.log('[useOptimizedAssignments] OPTIMIZED - Assignment-employee relationship change detected, refetching...');
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
