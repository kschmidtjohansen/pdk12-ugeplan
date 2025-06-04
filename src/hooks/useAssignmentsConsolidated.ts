import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';

export type AssignmentFilterType = 'all' | 'published' | 'unpublished' | 'user-specific' | 'dashboard' | 'planner';

interface UseAssignmentsOptions {
  filter?: AssignmentFilterType;
  includeUnpublished?: boolean;
}

export const useAssignmentsConsolidated = (options: UseAssignmentsOptions = {}) => {
  const { filter = 'all', includeUnpublished = true } = options;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch assignments from Supabase
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setAssignments([]);
        return;
      }
      
      // Fetch assignments with optimized query
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          car_id,
          published,
          responsible_user_id,
          created_at,
          updated_at,
          cars:car_id (id, name, car_number),
          responsible_user:responsible_user_id (id, name)
        `)
        .order('assignment_date', { ascending: true });
      
      if (assignmentsError) throw assignmentsError;
      
      if (assignmentsData) {
        // Get assignment-employee relationships
        const { data: assignmentEmployees, error: employeeError } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id')
          .order('assignment_id');
        
        if (employeeError) throw employeeError;
        
        // Get all profiles for the users in assignments
        const userIds = assignmentEmployees?.map(ae => ae.user_id) || [];
        let profilesData: any[] = [];
        
        if (userIds.length > 0) {
          const uniqueUserIds = [...new Set(userIds)];
          
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', uniqueUserIds)
            .order('name');
          
          if (profilesError) throw profilesError;
          profilesData = profiles || [];
        }
        
        // Process and combine the data
        const processedAssignments = assignmentsData.map(assignment => {
          // Find all employees for this assignment
          const assignmentEmployeeIds = assignmentEmployees
            ?.filter(emp => emp.assignment_id === assignment.id)
            ?.map(emp => emp.user_id) || [];
          
          // Map employee IDs to names
          const assignmentEmployeeNames: string[] = [];
          
          assignmentEmployeeIds.forEach(userId => {
            const profile = profilesData.find(p => p.id === userId);
            if (profile?.name && typeof profile.name === 'string' && profile.name.trim() !== '') {
              assignmentEmployeeNames.push(profile.name.trim());
            }
          });
          
          const processedAssignment: Assignment = {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description || '',
            date: assignment.assignment_date,
            fromTime: assignment.from_time,
            toTime: assignment.to_time,
            location: assignment.location,
            car: assignment.cars ? {
              id: assignment.cars.id,
              name: assignment.cars.name
            } : null,
            employees: assignmentEmployeeNames,
            published: assignment.published || false,
            responsibleUser: assignment.responsible_user ? {
              id: assignment.responsible_user.id,
              name: assignment.responsible_user.name
            } : null
          };
          
          return processedAssignment;
        });
        
        // Apply filtering based on options
        const filteredAssignments = applyFilter(processedAssignments, filter, user, includeUnpublished);
        setAssignments(filteredAssignments);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      toast({
        title: t('common.error'),
        description: t('planner.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filter, includeUnpublished, user, toast, t]);

  // Create assignment
  const createAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          title: assignmentData.title,
          description: assignmentData.description,
          assignment_date: assignmentData.date,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          location: assignmentData.location,
          car_id: assignmentData.car ? (typeof assignmentData.car === 'string' ? assignmentData.car : assignmentData.car.id) : null,
          published: assignmentData.published || false,
          responsible_user_id: assignmentData.responsibleUser ? (typeof assignmentData.responsibleUser === 'string' ? assignmentData.responsibleUser : assignmentData.responsibleUser.id) : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add employees if provided
      if (data && assignmentData.employees?.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('name', assignmentData.employees);

        if (profiles?.length) {
          const employeeInserts = profiles.map(profile => ({
            assignment_id: data.id,
            user_id: profile.id
          }));

          await supabase
            .from('assignments_employees')
            .insert(employeeInserts);
        }
      }

      await fetchAssignments();
      toast({
        title: t('planner.createSuccess'),
        description: t('planner.assignmentCreated'),
      });
      return true;
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('planner.createError'),
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchAssignments, toast, t]);

  // Update assignment
  const updateAssignment = useCallback(async (assignmentId: string, assignmentData: Partial<Assignment>) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({
          title: assignmentData.title,
          description: assignmentData.description,
          assignment_date: assignmentData.date,
          from_time: assignmentData.fromTime,
          to_time: assignmentData.toTime,
          location: assignmentData.location,
          car_id: assignmentData.car ? (typeof assignmentData.car === 'string' ? assignmentData.car : assignmentData.car.id) : null,
          published: assignmentData.published,
          responsible_user_id: assignmentData.responsibleUser ? (typeof assignmentData.responsibleUser === 'string' ? assignmentData.responsibleUser : assignmentData.responsibleUser.id) : null,
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // Update employees
      if (assignmentData.employees !== undefined) {
        // Remove existing employees
        await supabase
          .from('assignments_employees')
          .delete()
          .eq('assignment_id', assignmentId);

        // Add new employees
        if (assignmentData.employees.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('name', assignmentData.employees);

          if (profiles?.length) {
            const employeeInserts = profiles.map(profile => ({
              assignment_id: assignmentId,
              user_id: profile.id
            }));

            await supabase
              .from('assignments_employees')
              .insert(employeeInserts);
          }
        }
      }

      await fetchAssignments();
      toast({
        title: t('planner.updateSuccess'),
        description: t('planner.assignmentUpdated'),
      });
      return true;
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('planner.updateError'),
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchAssignments, toast, t]);

  // Delete assignment
  const deleteAssignment = useCallback(async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      await fetchAssignments();
      toast({
        title: t('planner.deleteSuccess'),
        description: t('planner.assignmentDeleted'),
      });
      return true;
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('planner.deleteError'),
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchAssignments, toast, t]);

  // Publish assignment
  const publishAssignment = useCallback(async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('id', assignmentId);

      if (error) throw error;

      await fetchAssignments();
      toast({
        title: t('planner.publishSuccess'),
        description: t('planner.assignmentPublished'),
      });
      return true;
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('planner.publishError'),
        variant: 'destructive',
      });
      return false;
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

      await fetchAssignments();
      toast({
        title: t('planner.publishSuccess'),
        description: t('planner.dayPublished'),
      });
      return true;
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('planner.publishError'),
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchAssignments, toast, t]);

  // Load assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);
  
  // Subscribe to assignment changes
  useEffect(() => {
    const channel = supabase
      .channel('assignment_changes_consolidated')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignments' },
        () => fetchAssignments()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignments_employees' },
        () => fetchAssignments()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAssignments]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate,
    isDialogOpen,
    setIsDialogOpen
  };
};

// Centralized filtering logic
const applyFilter = (
  assignments: Assignment[],
  filter: AssignmentFilterType,
  user: any,
  includeUnpublished: boolean
): Assignment[] => {
  if (!user) return [];

  switch (filter) {
    case 'all':
      return assignments;
      
    case 'published':
      return assignments.filter(a => a.published);
      
    case 'unpublished':
      return assignments.filter(a => !a.published);
      
    case 'dashboard':
      // For dashboard, servicemedarbejdere see only their published assignments
      // Admins/skadeledere see all published assignments
      if (user.role === 'servicemedarbejder') {
        return assignments.filter(a => 
          a.published && 
          a.employees && 
          a.employees.includes(user.name)
        );
      }
      return assignments.filter(a => includeUnpublished || a.published);
      
    case 'planner':
    case 'user-specific':
      // For planner view - servicemedarbejdere see all published, others see based on includeUnpublished
      if (user.role === 'servicemedarbejder') {
        return assignments.filter(a => a.published);
      }
      return assignments.filter(a => includeUnpublished || a.published);
      
    default:
      return assignments;
  }
};
