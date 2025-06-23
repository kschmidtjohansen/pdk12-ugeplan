
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
      
      console.log('[useOptimizedAssignments] COMPREHENSIVE FIX - Starting fetch with filter:', filter, 'User role:', user.role);

      // COMPREHENSIVE FIX: Simplified query without foreign key constraints to avoid naming conflicts
      const { data: assignmentsData, error: fetchError } = await supabase
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
          car_ids
        `)
        .order('assignment_date', { ascending: true });

      if (fetchError) {
        console.error('[useOptimizedAssignments] COMPREHENSIVE FIX - Assignment fetch error:', fetchError);
        throw fetchError;
      }

      console.log('[useOptimizedAssignments] COMPREHENSIVE FIX - Raw assignments fetched:', assignmentsData?.length || 0);

      if (!assignmentsData || assignmentsData.length === 0) {
        setAssignments([]);
        return;
      }

      // Apply filtering based on context and user role
      let filteredData = assignmentsData;
      
      switch (filter) {
        case 'user':
          // Dashboard context - Get user's assignments via assignments_employees OR responsible_user_id
          console.log('[useOptimizedAssignments] COMPREHENSIVE FIX - User filter: Getting user assignments for dashboard');
          
          const { data: userAssignmentIds } = await supabase
            .from('assignments_employees')
            .select('assignment_id')
            .eq('user_id', user.id);
          
          const assignmentIds = userAssignmentIds?.map(ua => ua.assignment_id) || [];
          
          filteredData = assignmentsData.filter(assignment => 
            assignmentIds.includes(assignment.id) || assignment.responsible_user_id === user.id
          );
          break;
          
        case 'all':
          // Planner context - Show based on user role
          if (user.role === 'servicemedarbejder') {
            console.log('[useOptimizedAssignments] COMPREHENSIVE FIX - Planner: Showing ALL published assignments for servicemedarbejder');
            filteredData = assignmentsData.filter(assignment => assignment.published === true);
          } else {
            console.log('[useOptimizedAssignments] COMPREHENSIVE FIX - Planner: Showing ALL assignments for admin/skadeleder');
            // No additional filter - admin/skadeleder see everything
          }
          break;
          
        case 'published':
          console.log('[useOptimizedAssignments] COMPREHENSIVE FIX - Published filter applied');
          filteredData = assignmentsData.filter(assignment => assignment.published === true);
          break;
          
        case 'unpublished':
          console.log('[useOptimizedAssignments] COMPREHENSIVE FIX - Unpublished filter applied');
          filteredData = assignmentsData.filter(assignment => assignment.published === false);
          break;
      }

      // COMPREHENSIVE FIX: Fetch related data separately to avoid foreign key constraint issues
      const assignmentIds = filteredData.map(a => a.id);
      const responsibleUserIds = [...new Set(filteredData.map(a => a.responsible_user_id).filter(Boolean))];
      const carIds = new Set<string>();
      
      filteredData.forEach(assignment => {
        if (assignment.car_id) carIds.add(assignment.car_id);
        if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
          assignment.car_ids.forEach((carId: string) => carIds.add(carId));
        }
      });

      // Fetch assignment employees
      let assignmentEmployees: any[] = [];
      if (assignmentIds.length > 0) {
        const { data: empData, error: empError } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id')
          .in('assignment_id', assignmentIds);
        
        if (empError) {
          console.warn('[useOptimizedAssignments] COMPREHENSIVE FIX - Employee fetch warning:', empError);
        } else {
          assignmentEmployees = empData || [];
        }
      }

      // Fetch profiles for employees and responsible users
      const allUserIds = new Set([
        ...assignmentEmployees.map(emp => emp.user_id),
        ...responsibleUserIds
      ]);
      
      let profilesData: any[] = [];
      if (allUserIds.size > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', Array.from(allUserIds));
        
        if (profilesError) {
          console.warn('[useOptimizedAssignments] COMPREHENSIVE FIX - Profiles fetch warning:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      // Fetch car data
      let carsData: any[] = [];
      if (carIds.size > 0) {
        const { data: cars, error: carsError } = await supabase
          .from('cars')
          .select('id, name, car_number')
          .in('id', Array.from(carIds));
        
        if (carsError) {
          console.warn('[useOptimizedAssignments] COMPREHENSIVE FIX - Cars fetch warning:', carsError);
        } else {
          carsData = cars || [];
        }
      }

      // COMPREHENSIVE FIX: Transform to Assignment format with all related data
      const finalAssignments: Assignment[] = filteredData.map(assignment => {
        // Get employee names for this assignment
        const employeeIds = assignmentEmployees
          .filter(emp => emp.assignment_id === assignment.id)
          .map(emp => emp.user_id);
        
        const employeeNames = employeeIds
          .map(userId => {
            const profile = profilesData.find(p => p.id === userId);
            return profile?.name;
          })
          .filter(name => name && typeof name === 'string')
          .map(name => name.trim());
        
        console.log(`[useOptimizedAssignments] COMPREHENSIVE FIX - Assignment ${assignment.id} employees:`, employeeNames);

        // Handle car data
        let carData = null;
        let carsArray: string[] = [];
        
        if (assignment.car_ids && Array.isArray(assignment.car_ids) && assignment.car_ids.length > 0) {
          carsArray = assignment.car_ids;
          const firstCar = carsData.find(c => c.id === assignment.car_ids[0]);
          if (firstCar) {
            carData = { id: firstCar.id, name: firstCar.name };
          }
        } else if (assignment.car_id) {
          carsArray = [assignment.car_id];
          const car = carsData.find(c => c.id === assignment.car_id);
          if (car) {
            carData = { id: car.id, name: car.name };
          }
        }

        // Get responsible user
        const responsibleUser = assignment.responsible_user_id 
          ? profilesData.find(p => p.id === assignment.responsible_user_id)
          : null;

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          car: carData,
          cars: carsArray,
          employees: employeeNames,
          published: assignment.published || false,
          responsibleUser: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name
          } : null
        };
      });
      
      console.log('[useOptimizedAssignments] COMPREHENSIVE FIX - Final assignments processed:', finalAssignments.length);
      console.log('[useOptimizedAssignments] COMPREHENSIVE FIX - Filter applied:', filter, 'User role:', user.role);
      
      setAssignments(finalAssignments);
      
    } catch (err) {
      console.error('[useOptimizedAssignments] COMPREHENSIVE FIX - Critical error:', err);
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
      .channel('assignments_comprehensive_fix')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        () => {
          console.log('[useOptimizedAssignments] COMPREHENSIVE FIX - Assignment change detected, refetching...');
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
          console.log('[useOptimizedAssignments] COMPREHENSIVE FIX - Assignment-employee relationship change detected, refetching...');
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
