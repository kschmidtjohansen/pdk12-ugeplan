
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Assignment } from '@/types/assignment';
import { PerformanceMonitor } from '@/utils/performanceMonitor';

interface CachedAssignmentData {
  assignments: Assignment[];
  timestamp: number;
  date: string;
}

const CACHE_DURATION = 30000; // 30 seconds
const assignmentCache = new Map<string, CachedAssignmentData>();

export const useAssignmentDataOptimized = (selectedDate?: string) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = (date?: string) => {
    return `assignments_${date || 'all'}`;
  };

  const fetchAssignments = useCallback(async (date?: string) => {
    const timer = PerformanceMonitor.startTimer('fetch_assignments');
    
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cacheKey = getCacheKey(date);
      const cached = assignmentCache.get(cacheKey);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('[useAssignmentDataOptimized] Using cached data for', date || 'all dates');
        setAssignments(cached.assignments);
        setLoading(false);
        timer();
        return;
      }

      console.log('[useAssignmentDataOptimized] Fetching fresh data for', date || 'all dates');

      let query = supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          location,
          assignment_date,
          from_time,
          to_time,
          type,
          published,
          created_at,
          updated_at,
          car_id,
          car_ids,
          responsible_user_id
        `);

      if (date) {
        query = query.eq('assignment_date', date);
      }

      const { data: assignmentsData, error: assignmentsError } = await query.order('assignment_date', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      if (!assignmentsData) {
        setAssignments([]);
        setLoading(false);
        timer();
        return;
      }

      // Fetch employee assignments separately
      const assignmentIds = assignmentsData.map(a => a.id);
      let employeeAssignments: any[] = [];
      
      if (assignmentIds.length > 0) {
        const { data: empAssignments, error: empError } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id')
          .in('assignment_id', assignmentIds);

        if (empError) {
          console.error('Error fetching employee assignments:', empError);
        } else {
          employeeAssignments = empAssignments || [];
        }
      }

      // Fetch profiles separately  
      const userIds = [...new Set([
        ...employeeAssignments.map(ea => ea.user_id),
        ...assignmentsData.map(a => a.responsible_user_id).filter(Boolean)
      ])];

      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          profiles = profilesData || [];
        }
      }

      // Transform and combine data
      const transformedAssignments: Assignment[] = assignmentsData.map(assignment => {
        // Get assigned employee IDs for this assignment
        const assignedEmployeeIds = employeeAssignments
          .filter(ea => ea.assignment_id === assignment.id)
          .map(ea => ea.user_id);

        // Get responsible user
        const responsibleUser = assignment.responsible_user_id 
          ? profiles.find(p => p.id === assignment.responsible_user_id)
          : null;

        // Get car IDs (convert car objects to IDs)
        let carIds: string[] = [];
        if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
          carIds = assignment.car_ids;
        } else if (assignment.car_id) {
          carIds = [assignment.car_id];
        }

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          location: assignment.location,
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          type: assignment.type || 'other',
          published: assignment.published || false,
          createdAt: new Date(assignment.created_at),
          updatedAt: new Date(assignment.updated_at),
          employees: assignedEmployeeIds, // Return employee IDs as strings
          responsibleUser: responsibleUser ? {
            id: responsibleUser.id,
            name: responsibleUser.name || 'Unknown'
          } : null,
          car: assignment.car_id ? assignment.car_id : null, // Return car ID as string
          cars: carIds // Return car IDs as string array
        };
      });

      // Cache the results
      assignmentCache.set(cacheKey, {
        assignments: transformedAssignments,
        timestamp: now,
        date: date || 'all'
      });

      setAssignments(transformedAssignments);
      PerformanceMonitor.recordMetric('assignments_fetched', transformedAssignments.length);
      
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
      timer();
    }
  }, []);

  // Clear cache when data changes
  const invalidateCache = useCallback((date?: string) => {
    if (date) {
      assignmentCache.delete(getCacheKey(date));
    } else {
      assignmentCache.clear();
    }
  }, []);

  useEffect(() => {
    fetchAssignments(selectedDate);
  }, [fetchAssignments, selectedDate]);

  return {
    assignments,
    loading,
    error,
    refetch: () => fetchAssignments(selectedDate),
    invalidateCache
  };
};
