
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { getAllCarIds } from '@/utils/carHelpers';

interface UseAssignmentsConsolidatedOptions {
  filter?: 'all' | 'my' | 'planner';
  showUnpublished?: boolean;
}

export const useAssignmentsConsolidated = (options: UseAssignmentsConsolidatedOptions = {}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch assignments from Supabase
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user info for filtering
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      console.log('[useAssignmentsConsolidated] Fetching assignments...');
      console.log('[useAssignmentsConsolidated] Current user:', currentUser?.id);
      console.log('[useAssignmentsConsolidated] Filter type:', options.filter);
      
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
      
      console.log('[useAssignmentsConsolidated] Raw assignments data:', assignmentsData?.length || 0);
      
      if (assignmentsData) {
        // Get assignment-employee relationships
        const { data: assignmentEmployees, error: employeeError } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id')
          .order('assignment_id');
        
        if (employeeError) {
          console.error('[useAssignmentsConsolidated] Error fetching assignment employees:', employeeError);
          throw employeeError;
        }
        
        console.log('[useAssignmentsConsolidated] Assignment employees:', assignmentEmployees?.length || 0);
        
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
          
          if (profilesError) {
            console.error('[useAssignmentsConsolidated] Error fetching profiles:', profilesError);
            throw profilesError;
          }
          profilesData = profiles || [];
        }
        
        console.log('[useAssignmentsConsolidated] Profiles data:', profilesData.length);
        
        // Process and combine the data
        const processedAssignments = assignmentsData.map(assignment => {
          // Find all employees for this assignment
          const assignmentEmployeeIds = assignmentEmployees
            ?.filter(emp => emp.assignment_id === assignment.id)
            ?.map(emp => emp.user_id) || [];
          
          // Map employee IDs to names efficiently
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
        
        console.log('[useAssignmentsConsolidated] Processed assignments:', processedAssignments.length);
        
        setAssignments(processedAssignments);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error('[useAssignmentsConsolidated] Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      toast({
        title: t('common.error'),
        description: t('planner.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Publish a single assignment
  const publishAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('id', assignmentId);

      if (error) throw error;

      // Find the assignment to get car information for notification
      const assignment = assignments.find(a => a.id === assignmentId);
      const carIds = assignment ? getAllCarIds(assignment.car) : [];
      
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
    }
  };

  // Publish all assignments for a specific date
  const publishAssignmentsByDate = async (date: string) => {
    try {
      const unpublishedAssignments = assignments.filter(
        a => a.date === date && !a.published
      );

      if (unpublishedAssignments.length === 0) {
        toast({
          title: t('planner.noUnpublishedAssignments'),
          description: t('planner.noUnpublishedAssignmentsMsg'),
        });
        return;
      }

      const { error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('assignment_date', date)
        .eq('published', false);

      if (error) throw error;

      // Collect unique car IDs from all published assignments
      const allCarIds = unpublishedAssignments.reduce((carIds: string[], assignment) => {
        const assignmentCarIds = getAllCarIds(assignment.car);
        return [...carIds, ...assignmentCarIds];
      }, []);
      
      const uniqueCarIds = [...new Set(allCarIds)];

      toast({
        title: t('planner.assignmentsPublished'),
        description: t('planner.assignmentsPublishedMsg', { count: unpublishedAssignments.length }),
      });

      fetchAssignments();
    } catch (error: any) {
      console.error('Error publishing assignments:', error);
      toast({
        title: t('common.error'),
        description: t('planner.errorPublishingAssignments'),
        variant: "destructive",
      });
    }
  };

  // Filter assignments based on options
  const filteredAssignments = useMemo(() => {
    let filtered = [...assignments];
    
    // Apply filter type
    if (options.filter === 'my' && user) {
      filtered = filtered.filter(assignment => 
        assignment.employees?.includes(user.name || '') ||
        assignment.responsibleUser?.id === user.id
      );
    }
    
    // Apply published filter
    if (options.showUnpublished === false) {
      filtered = filtered.filter(assignment => assignment.published);
    }
    
    return filtered;
  }, [assignments, options, user]);

  // Load assignments on component mount and when options change
  useEffect(() => {
    fetchAssignments();
  }, [options.filter]);
  
  // Subscribe to assignment changes
  useEffect(() => {
    const channel = supabase
      .channel('consolidated_assignment_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        () => {
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
          fetchAssignments();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    assignments: filteredAssignments,
    loading,
    error,
    fetchAssignments,
    setAssignments,
    isDialogOpen,
    setIsDialogOpen,
    publishAssignment,
    publishAssignmentsByDate
  };
};
