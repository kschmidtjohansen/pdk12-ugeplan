
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabaseOptimized, enhancedSupabaseOptimized } from '@/integrations/supabase/clientOptimized';
import { PerformanceMonitor, ErrorRecovery } from '@/utils/performanceOptimizations';

// Type definitions for better type safety
interface AssignmentRow {
  id: string;
  title: string;
  description: string | null;
  assignment_date: string;
  from_time: string;
  to_time: string;
  location: string;
  car_id: string | null;
  car_ids: string[] | null;
  published: boolean;
  responsible_user_id: string | null;
  created_at: string;
  updated_at: string;
  cars: { id: string; name: string } | null;
  responsible_user: { id: string; name: string } | null;
}

interface EmployeeRelation {
  assignment_id: string;
  user_id: string;
}

interface ProfileData {
  id: string;
  name: string;
}

interface CarData {
  id: string;
  name: string;
  car_number: string;
}

// Advanced caching layer with TTL and invalidation
class AssignmentCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static instance: AssignmentCache;
  
  static getInstance() {
    if (!AssignmentCache.instance) {
      AssignmentCache.instance = new AssignmentCache();
    }
    return AssignmentCache.instance;
  }
  
  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default TTL
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone to prevent mutations
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
    
    return JSON.parse(JSON.stringify(item.data)); // Return deep clone
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

// Connection pool manager for better resource utilization
class ConnectionManager {
  private static activeConnections = 0;
  private static readonly MAX_CONNECTIONS = 5;
  private static queue: Array<() => void> = [];
  
  static async acquireConnection<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeOperation = async () => {
        this.activeConnections++;
        console.log(`[ConnectionManager] Active connections: ${this.activeConnections}`);
        
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeConnections--;
          console.log(`[ConnectionManager] Released connection. Active: ${this.activeConnections}`);
          
          // Process next item in queue
          if (this.queue.length > 0) {
            const nextOperation = this.queue.shift();
            if (nextOperation) {
              setTimeout(nextOperation, 0);
            }
          }
        }
      };
      
      if (this.activeConnections < this.MAX_CONNECTIONS) {
        executeOperation();
      } else {
        console.log(`[ConnectionManager] Queuing operation. Queue size: ${this.queue.length + 1}`);
        this.queue.push(executeOperation);
      }
    });
  }
}

export const useAssignmentDataPhase3 = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    fetchTime: number;
    cacheHitRate: number;
    errorRate: number;
  }>({
    fetchTime: 0,
    cacheHitRate: 0,
    errorRate: 0
  });
  
  const { toast } = useToast();
  const { t } = useTranslation();
  const cache = AssignmentCache.getInstance();
  const fetchCountRef = useRef(0);
  const cacheHitsRef = useRef(0);
  const errorsRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Advanced fetch with comprehensive optimizations
  const fetchAssignments = useCallback(async (skipCache: boolean = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const startTimer = PerformanceMonitor.startTimer('assignment_fetch_phase3');
    
    try {
      setLoading(true);
      setError(null);
      fetchCountRef.current++;
      
      console.log('[useAssignmentDataPhase3] Starting Phase 3 optimized fetch...');
      
      const cacheKey = 'assignments_all_phase3';
      
      // Check cache first unless explicitly skipping
      if (!skipCache) {
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
          console.log('[useAssignmentDataPhase3] Cache hit - using cached data');
          setAssignments(cachedData);
          cacheHitsRef.current++;
          setLoading(false);
          startTimer();
          return;
        }
      }
      
      // Use connection pooling for database operations
      const result = await ConnectionManager.acquireConnection(async () => {
        return await ErrorRecovery.withRetry(
          async () => {
            // Step 1: Fetch core assignment data with optimized query
            const assignmentsResult = await enhancedSupabaseOptimized.safeQuery(
              async () => {
                const { data, error } = await supabaseOptimized
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
                    cars:car_id (id, name),
                    responsible_user:responsible_user_id (id, name)
                  `)
                  .order('assignment_date', { ascending: true });
                return { data, error };
              },
              'assignment_fetch_phase3'
            );
            
            if (assignmentsResult.error) throw assignmentsResult.error;
            const assignmentsData = assignmentsResult.data as AssignmentRow[];
            
            if (!assignmentsData || assignmentsData.length === 0) {
              return [];
            }
            
            console.log('[useAssignmentDataPhase3] Fetched core assignments:', assignmentsData.length);
            
            // Step 2: Batch fetch related data with parallel processing
            const assignmentIds = assignmentsData.map(a => a.id);
            
            const [employeeRelations, profilesData, carsData] = await Promise.all([
              // Get assignment-employee relationships
              enhancedSupabaseOptimized.safeQuery(
                async () => {
                  const { data, error } = await supabaseOptimized
                    .from('assignments_employees')
                    .select('assignment_id, user_id')
                    .in('assignment_id', assignmentIds);
                  return { data, error };
                },
                'employee_relations_fetch'
              ),
              
              // Get all car data in parallel
              (async () => {
                const allCarIds = new Set<string>();
                assignmentsData.forEach(assignment => {
                  if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
                    assignment.car_ids.forEach((carId: string) => allCarIds.add(carId));
                  }
                  if (assignment.car_id) {
                    allCarIds.add(assignment.car_id);
                  }
                });
                
                if (allCarIds.size === 0) return { data: [], error: null };
                
                return enhancedSupabaseOptimized.safeQuery(
                  async () => {
                    const { data, error } = await supabaseOptimized
                      .from('cars')
                      .select('id, name, car_number')
                      .in('id', Array.from(allCarIds));
                    return { data, error };
                  },
                  'cars_batch_fetch'
                );
              })(),
              
              // Get profiles data
              (async () => {
                const employeeRelationsResult = await enhancedSupabaseOptimized.safeQuery(
                  async () => {
                    const { data, error } = await supabaseOptimized
                      .from('assignments_employees')
                      .select('user_id')
                      .in('assignment_id', assignmentIds);
                    return { data, error };
                  },
                  'employee_ids_fetch'
                );
                
                if (employeeRelationsResult.error) return { data: [], error: null };
                
                const userIds = (employeeRelationsResult.data as EmployeeRelation[] || []).map(emp => emp.user_id);
                const uniqueUserIds = [...new Set(userIds)];
                
                if (uniqueUserIds.length === 0) return { data: [], error: null };
                
                return enhancedSupabaseOptimized.safeQuery(
                  async () => {
                    const { data, error } = await supabaseOptimized
                      .from('profiles')
                      .select('id, name')
                      .in('id', uniqueUserIds);
                    return { data, error };
                  },
                  'profiles_batch_fetch'
                );
              })()
            ]);
            
            // Step 3: Process and optimize data mapping
            const employeeData = (employeeRelations.data as EmployeeRelation[]) || [];
            const profiles = (profilesData.data as ProfileData[]) || [];
            const cars = (carsData.data as CarData[]) || [];
            
            // Create lookup maps for O(1) access
            const profileMap = new Map(profiles.map(p => [p.id, p]));
            const carMap = new Map(cars.map(c => [c.id, c]));
            const employeeMap = new Map<string, string[]>();
            
            // Build employee assignment map efficiently
            employeeData.forEach(emp => {
              if (!employeeMap.has(emp.assignment_id)) {
                employeeMap.set(emp.assignment_id, []);
              }
              const profile = profileMap.get(emp.user_id);
              if (profile?.name) {
                employeeMap.get(emp.assignment_id)!.push(profile.name.trim());
              }
            });
            
            // Step 4: Transform data efficiently
            const processedAssignments = assignmentsData.map(assignment => {
              // Get employee names from lookup map
              const employeeNames = employeeMap.get(assignment.id) || [];
              
              // Handle multiple cars efficiently
              let carData = null;
              let carsArray: string[] = [];
              
              if (assignment.car_ids && Array.isArray(assignment.car_ids) && assignment.car_ids.length > 0) {
                carsArray = assignment.car_ids;
                const firstCar = carMap.get(assignment.car_ids[0]);
                if (firstCar) {
                  carData = { id: firstCar.id, name: firstCar.name };
                }
              } else if (assignment.car_id) {
                carsArray = [assignment.car_id];
                const car = carMap.get(assignment.car_id);
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
            
            return processedAssignments;
          },
          'assignment_fetch_phase3',
          3
        );
      });
      
      console.log('[useAssignmentDataPhase3] Successfully processed assignments:', result.length);
      
      // Cache the results with smart TTL based on data freshness
      const now = new Date();
      const hasRecentData = result.some(a => {
        const assignmentDate = new Date(a.date);
        const diffDays = Math.abs(assignmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7; // Within a week
      });
      
      const cacheTTL = hasRecentData ? 180000 : 600000; // 3 min for recent data, 10 min for older
      cache.set(cacheKey, result, cacheTTL);
      
      setAssignments(result);
      
    } catch (err) {
      console.error('[useAssignmentDataPhase3] Critical error:', err);
      errorsRef.current++;
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      
      // Try to fall back to cached data on error
      const fallbackData = cache.get('assignments_all_phase3');
      if (fallbackData) {
        console.log('[useAssignmentDataPhase3] Using fallback cached data due to error');
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
      startTimer();
      
      // Update performance metrics
      const totalRequests = fetchCountRef.current;
      const cacheHits = cacheHitsRef.current;
      const errors = errorsRef.current;
      
      setPerformanceMetrics({
        fetchTime: performance.now(),
        cacheHitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
        errorRate: totalRequests > 0 ? (errors / totalRequests) * 100 : 0
      });
    }
  }, [toast, t, cache]);

  // Intelligent refresh with adaptive intervals
  useEffect(() => {
    fetchAssignments();
    
    // Adaptive refresh intervals based on time of day and usage patterns
    const getRefreshInterval = () => {
      const hour = new Date().getHours();
      
      // More frequent updates during business hours
      if (hour >= 8 && hour <= 17) {
        return 120000; // 2 minutes during business hours
      } else if (hour >= 18 && hour <= 22) {
        return 300000; // 5 minutes during evening
      } else {
        return 600000; // 10 minutes during night/early morning
      }
    };
    
    const intervalId = setInterval(() => {
      fetchAssignments();
    }, getRefreshInterval());
    
    return () => {
      clearInterval(intervalId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAssignments]);
  
  // Enhanced realtime with intelligent debouncing and change detection
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let changeCount = 0;
    const MAX_CHANGES_BEFORE_REFRESH = 5;
    
    const intelligentRefresh = (changeType: string) => {
      changeCount++;
      console.log(`[useAssignmentDataPhase3] Change detected: ${changeType}, count: ${changeCount}`);
      
      clearTimeout(timeoutId);
      
      // Immediate refresh for critical changes, debounced for others
      const isCriticalChange = changeType === 'INSERT' || changeType === 'DELETE';
      const debounceDelay = isCriticalChange ? 100 : 500;
      
      // Force refresh if too many changes accumulated
      if (changeCount >= MAX_CHANGES_BEFORE_REFRESH) {
        console.log('[useAssignmentDataPhase3] Too many changes, forcing immediate refresh');
        changeCount = 0;
        fetchAssignments(true); // Skip cache for forced refresh
        return;
      }
      
      timeoutId = setTimeout(() => {
        console.log('[useAssignmentDataPhase3] Executing debounced refresh');
        changeCount = 0;
        fetchAssignments();
      }, debounceDelay);
    };
    
    const channel = supabaseOptimized
      .channel('assignments_phase3_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        (payload) => {
          cache.invalidate('assignments'); // Invalidate cache on changes
          intelligentRefresh(payload.eventType);
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
          cache.invalidate('assignments'); // Invalidate cache on changes
          intelligentRefresh(payload.eventType);
        }
      )
      .subscribe((status) => {
        console.log('[useAssignmentDataPhase3] Realtime subscription status:', status);
      });
      
    return () => {
      clearTimeout(timeoutId);
      supabaseOptimized.removeChannel(channel);
    };
  }, [fetchAssignments, cache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Advanced invalidation methods
  const invalidateCache = useCallback(() => {
    cache.clear();
    console.log('[useAssignmentDataPhase3] Cache invalidated manually');
  }, [cache]);

  const forceRefresh = useCallback(() => {
    invalidateCache();
    return fetchAssignments(true);
  }, [fetchAssignments, invalidateCache]);

  // Performance monitoring access
  const getPerformanceStats = useCallback(() => {
    return {
      ...performanceMetrics,
      cacheSize: cache['cache'].size,
      totalRequests: fetchCountRef.current,
      cacheHits: cacheHitsRef.current,
      errors: errorsRef.current
    };
  }, [performanceMetrics, cache]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    setAssignments,
    performanceMetrics,
    invalidateCache,
    forceRefresh,
    getPerformanceStats
  };
};
