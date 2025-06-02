
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { safeProperty } from '@/utils/dbHelpers';

export const useAssignmentData = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch assignments from Supabase
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentData] Starting to fetch assignments...');
      
      // Get all assignments with car information and employee data in one query
      const { data, error } = await supabase
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
          created_at,
          updated_at,
          cars:car_id (id, name, car_number),
          assignments_employees!inner (
            user_id,
            profiles!inner (id, name)
          )
        `);
      
      if (error) throw error;
      
      console.log('[useAssignmentData] Raw Supabase response:', data);
      
      if (data) {
        // Group assignments by ID and aggregate employee names
        const assignmentMap = new Map<string, any>();
        
        data.forEach(row => {
          const assignmentId = row.id;
          
          if (!assignmentMap.has(assignmentId)) {
            assignmentMap.set(assignmentId, {
              id: row.id,
              title: row.title,
              description: row.description || '',
              date: row.assignment_date,
              fromTime: row.from_time,
              toTime: row.to_time,
              location: row.location,
              car: row.cars ? {
                id: row.cars.id,
                name: row.cars.name,
                car_number: row.cars.car_number
              } : null,
              employees: [],
              published: row.published || false
            });
          }
          
          // Add employee name if it exists and isn't already added
          if (row.assignments_employees?.profiles?.name) {
            const assignment = assignmentMap.get(assignmentId);
            const employeeName = row.assignments_employees.profiles.name;
            
            if (!assignment.employees.includes(employeeName)) {
              assignment.employees.push(employeeName);
            }
          }
        });
        
        const processedAssignments = Array.from(assignmentMap.values());
        
        console.log('[useAssignmentData] Processed assignments with aggregated employees:', processedAssignments.map(a => ({
          id: a.id,
          location: a.location,
          published: a.published,
          employees: a.employees
        })));
        
        setAssignments(processedAssignments);
      } else {
        console.log('[useAssignmentData] No assignment data returned');
        setAssignments([]);
      }
    } catch (err) {
      console.error('[useAssignmentData] Error fetching assignments:', err);
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

  // Load assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, []);
  
  // Subscribe to assignment changes
  useEffect(() => {
    const channel = supabase
      .channel('assignment_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        () => {
          console.log('[useAssignmentData] Assignment table changed, refreshing...');
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
          console.log('[useAssignmentData] Assignment employees table changed, refreshing...');
          fetchAssignments();
        }
      )
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
