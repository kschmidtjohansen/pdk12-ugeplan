
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';

export type AssignmentFilterType = 'all' | 'published' | 'unpublished' | 'user-specific' | 'dashboard';

interface UseAssignmentsOptions {
  filter?: AssignmentFilterType;
  includeUnpublished?: boolean;
}

export const useAssignmentsConsolidated = (options: UseAssignmentsOptions = {}) => {
  const { filter = 'all', includeUnpublished = true } = options;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
    fetchAssignments
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
