
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';

export const useAssignmentDataOptimized = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Optimized fetch with improved query structure and error handling
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentDataOptimized] Starting optimized assignment fetch...');
      
      // Single optimized query with all necessary joins
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
          car_ids,
          published,
          responsible_user_id,
          created_at,
          updated_at,
          cars:car_id (
            id,
            name,
            car_number
          ),
          responsible_user:responsible_user_id (
            id,
            name
          )
        `)
        .order('assignment_date', { ascending: true });
      
      if (assignmentsError) {
        console.error('[useAssignmentDataOptimized] Assignment fetch error:', assignmentsError);
        throw assignmentsError;
      }
      
      if (!assignmentsData || assignmentsData.length === 0) {
        console.log('[useAssignmentDataOptimized] No assignments found');
        setAssignments([]);
        return;
      }
      
      console.log('[useAssignmentDataOptimized] Fetched assignments:', assignmentsData.length);
      
      // Separate queries for assignment employees and profiles to avoid join issues
      const assignmentIds = assignmentsData.map(a => a.id);
      
      // Get assignment-employee relationships
      const { data: assignmentEmployees, error: employeeError } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds);
      
      if (employeeError) {
        console.warn('[useAssignmentDataOptimized] Employee fetch warning:', employeeError);
        // Continue without employee data rather than failing
      }
      
      // Get all unique user IDs from assignment employees
      const userIds = assignmentEmployees?.map(emp => emp.user_id) || [];
      const uniqueUserIds = [...new Set(userIds)];
      
      // Fetch profiles for these users
      let profilesData: any[] = [];
      if (uniqueUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uniqueUserIds);
          
        if (profilesError) {
          console.warn('[useAssignmentDataOptimized] Profiles fetch warning:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }
      
      // Optimized car data fetch for multiple cars
      const allCarIds = new Set<string>();
      assignmentsData.forEach(assignment => {
        if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
          assignment.car_ids.forEach((carId: string) => allCarIds.add(carId));
        }
        if (assignment.car_id) {
          allCarIds.add(assignment.car_id);
        }
      });

      let carsData: any[] = [];
      if (allCarIds.size > 0) {
        const { data: cars, error: carsError } = await supabase
          .from('cars')
          .select('id, name, car_number')
          .in('id', Array.from(allCarIds));
        
        if (carsError) {
          console.warn('[useAssignmentDataOptimized] Cars fetch warning:', carsError);
        } else {
          carsData = cars || [];
        }
      }
      
      // Process assignments with optimized data mapping
      const processedAssignments = assignmentsData.map(assignment => {
        // Map employee relationships efficiently using lookup maps
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
        
        // Handle multiple cars efficiently
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
          responsibleUser: assignment.responsible_user ? {
            id: assignment.responsible_user.id,
            name: assignment.responsible_user.name
          } : null
        } as Assignment;
      });
      
      console.log('[useAssignmentDataOptimized] Successfully processed assignments:', processedAssignments.length);
      setAssignments(processedAssignments);
      
    } catch (err) {
      console.error('[useAssignmentDataOptimized] Critical error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      
      if (err instanceof Error && err.message.includes('row-level security')) {
        toast({
          title: t('common.error'),
          description: t('auth.sessionExpired') || 'Session expired, please log in again',
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.error'),
          description: t('planner.fetchError') || 'Failed to load assignments',
          variant: 'destructive',
        });
      }
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Load assignments on mount
  useEffect(() => {
    fetchAssignments();
  }, []);
  
  // Optimized realtime subscription with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(fetchAssignments, 300); // 300ms debounce
    };
    
    const channel = supabase
      .channel('assignments_optimized_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        (payload) => {
          console.log('[useAssignmentDataOptimized] Assignment change detected:', payload.eventType);
          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments_employees'
        },
        (payload) => {
          console.log('[useAssignmentDataOptimized] Assignment employee change detected:', payload.eventType);
          debouncedRefresh();
        }
      )
      .subscribe((status) => {
        console.log('[useAssignmentDataOptimized] Realtime subscription status:', status);
      });
      
    return () => {
      clearTimeout(timeoutId);
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
