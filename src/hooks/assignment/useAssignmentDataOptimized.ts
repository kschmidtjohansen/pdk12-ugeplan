
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabaseOptimized, enhancedSupabaseOptimized } from '@/integrations/supabase/clientOptimized';

// Simple cache with TTL
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 300000) {
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return JSON.parse(JSON.stringify(item.data));
  }
  
  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  clear() {
    this.cache.clear();
  }
}

const cache = new SimpleCache();

export const useAssignmentDataOptimized = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { t } = useTranslation();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAssignments = useCallback(async (skipCache: boolean = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const cacheKey = 'assignments_optimized';
      
      if (!skipCache) {
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
          setAssignments(cachedData);
          setLoading(false);
          return;
        }
      }
      
      // Optimized single query with all necessary joins
      const { data: assignmentsData, error: assignmentsError } = await supabaseOptimized
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
            name
          ),
          responsible_user:profiles!assignments_responsible_user_id_fkey (
            id,
            name
          )
        `)
        .order('assignment_date', { ascending: true })
        .order('from_time', { ascending: true });
      
      if (assignmentsError) throw assignmentsError;
      
      if (!assignmentsData || assignmentsData.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }
      
      // Get assignment IDs for employee lookup
      const assignmentIds = assignmentsData.map(a => a.id);
      
      // Batch fetch employee relationships and profiles
      const { data: employeeData, error: employeeError } = await supabaseOptimized
        .from('assignments_employees')
        .select(`
          assignment_id,
          user_id,
          profiles!assignments_employees_user_id_fkey (
            id,
            name
          )
        `)
        .in('assignment_id', assignmentIds);
      
      if (employeeError) throw employeeError;
      
      // Get all car IDs from car_ids arrays
      const allCarIds = new Set<string>();
      assignmentsData.forEach(assignment => {
        if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
          assignment.car_ids.forEach((carId: string) => allCarIds.add(carId));
        }
        if (assignment.car_id) {
          allCarIds.add(assignment.car_id);
        }
      });
      
      // Batch fetch additional car data
      let additionalCars: any[] = [];
      if (allCarIds.size > 0) {
        const { data: carsData, error: carsError } = await supabaseOptimized
          .from('cars')
          .select('id, name, car_number')
          .in('id', Array.from(allCarIds));
        
        if (carsError) throw carsError;
        additionalCars = carsData || [];
      }
      
      // Create lookup maps
      const carMap = new Map(additionalCars.map(c => [c.id, c]));
      const employeeMap = new Map<string, string[]>();
      
      // Build employee assignment map
      (employeeData || []).forEach(emp => {
        if (!employeeMap.has(emp.assignment_id)) {
          employeeMap.set(emp.assignment_id, []);
        }
        if (emp.profiles?.name) {
          employeeMap.get(emp.assignment_id)!.push(emp.profiles.name.trim());
        }
      });
      
      // Transform data
      const processedAssignments = assignmentsData.map(assignment => {
        const employeeNames = employeeMap.get(assignment.id) || [];
        
        let carData = null;
        let carsArray: string[] = [];
        
        if (assignment.car_ids && Array.isArray(assignment.car_ids) && assignment.car_ids.length > 0) {
          carsArray = assignment.car_ids;
          const firstCar = carMap.get(assignment.car_ids[0]) || assignment.cars;
          if (firstCar) {
            carData = { id: firstCar.id, name: firstCar.name };
          }
        } else if (assignment.car_id && assignment.cars) {
          carsArray = [assignment.car_id];
          carData = { id: assignment.cars.id, name: assignment.cars.name };
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
      
      cache.set(cacheKey, processedAssignments, 180000); // 3 minutes cache
      setAssignments(processedAssignments);
      
    } catch (err) {
      console.error('[useAssignmentDataOptimized] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      
      const fallbackData = cache.get('assignments_optimized');
      if (fallbackData) {
        setAssignments(fallbackData);
      } else {
        setAssignments([]);
        toast({
          title: t('common.error'),
          description: t('planner.fetchError') || 'Failed to load assignments',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchAssignments();
    
    const intervalId = setInterval(() => {
      fetchAssignments();
    }, 120000); // 2 minutes
    
    return () => {
      clearInterval(intervalId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAssignments]);
  
  // Enhanced realtime with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        cache.invalidate('assignments');
        fetchAssignments();
      }, 500);
    };
    
    const channel = supabaseOptimized
      .channel('assignments_optimized_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignments' },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignments_employees' },
        debouncedRefresh
      )
      .subscribe();
      
    return () => {
      clearTimeout(timeoutId);
      supabaseOptimized.removeChannel(channel);
    };
  }, [fetchAssignments]);

  const invalidateCache = useCallback(() => {
    cache.clear();
  }, []);

  const forceRefresh = useCallback(() => {
    invalidateCache();
    return fetchAssignments(true);
  }, [fetchAssignments, invalidateCache]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    setAssignments,
    invalidateCache,
    forceRefresh
  };
};
