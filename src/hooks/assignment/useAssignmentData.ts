
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useAssignmentData = (filter: 'all' | 'published' | 'my' = 'all') => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentData] Fetching assignments with filter:', filter);
      
      // Build the query based on user role and filter
      let query = supabase
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
          car_ids,
          published,
          responsible_user_id,
          created_at,
          updated_at,
          car:cars!fk_assignments_car_id (
            id,
            name,
            car_number
          ),
          responsible_user:profiles!fk_assignments_responsible_user_id (
            id,
            name
          )
        `)
        .order('assignment_date', { ascending: true });

      // Apply filter based on user role
      if (filter === 'published') {
        query = query.eq('published', true);
      } else if (filter === 'my' && user?.role === 'servicemedarbejder') {
        // For servicemedarbejder, only show assignments they're assigned to
        query = query.eq('published', true);
      }

      const { data: assignmentsData, error: assignmentsError } = await query;
      
      if (assignmentsError) throw assignmentsError;
      if (!assignmentsData) {
        setAssignments([]);
        return;
      }
      
      // Get assignment-employee relationships
      const assignmentIds = assignmentsData.map(a => a.id);
      const { data: assignmentEmployees } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds);
      
      // Get employee names
      const userIds = assignmentEmployees?.map(emp => emp.user_id) || [];
      const uniqueUserIds = [...new Set(userIds)];
      
      let profilesData: any[] = [];
      if (uniqueUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uniqueUserIds);
        profilesData = profiles || [];
      }
      
      // Process assignments
      let processedAssignments = assignmentsData.map(assignment => {
        const assignmentEmployeeData = assignmentEmployees?.filter(
          emp => emp.assignment_id === assignment.id
        ) || [];
        
        const employeeNames = assignmentEmployeeData
          .map(emp => {
            const profile = profilesData.find(p => p.id === emp.user_id);
            return profile?.name;
          })
          .filter(name => name && typeof name === 'string')
          .map(name => name.trim());
        
        // Handle car data
        let carData = null;
        let carsArray: string[] = [];
        
        if (assignment.car_ids && Array.isArray(assignment.car_ids) && assignment.car_ids.length > 0) {
          carsArray = assignment.car_ids;
        } else if (assignment.car_id) {
          carsArray = [assignment.car_id];
        }
        
        if (assignment.car) {
          carData = { id: assignment.car.id, name: assignment.car.name };
        }
        
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
          responsibleUser: assignment.responsible_user && typeof assignment.responsible_user === 'object' ? {
            id: assignment.responsible_user.id,
            name: assignment.responsible_user.name
          } : null
        } as Assignment;
      });

      // Additional filtering for servicemedarbejder
      if (filter === 'my' && user?.role === 'servicemedarbejder') {
        processedAssignments = processedAssignments.filter(assignment => 
          assignment.employees?.includes(user.name || '')
        );
      }
      
      console.log(`[useAssignmentData] Processed ${processedAssignments.length} assignments for ${user?.role}`);
      setAssignments(processedAssignments);
      
    } catch (err) {
      console.error('[useAssignmentData] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      
      toast({
        title: t('common.error'),
        description: t('planner.fetchError') || 'Failed to load assignments',
        variant: 'destructive',
      });
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [filter, user?.role, user?.name]);
  
  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('assignment_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        console.log('[useAssignmentData] Assignment change detected');
        fetchAssignments();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments_employees' }, () => {
        console.log('[useAssignmentData] Assignment employee change detected');
        fetchAssignments();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    setAssignments
  };
};
