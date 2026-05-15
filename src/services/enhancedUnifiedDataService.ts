import { enhancedDataFetching } from './enhancedDataFetching';
import { enhancedErrorHandler } from './enhancedErrorHandler';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { systemHealthService } from './systemHealthService';
import { format } from 'date-fns';

interface DataFetchResult<T> {
  data: T[];
  error: string | null;
  fromCache: boolean;
  healthCheck: boolean;
}

class EnhancedUnifiedDataService {
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHealthMonitoring();
  }

  private startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await systemHealthService.quickHealthCheck();
      if (!isHealthy) {
        if (import.meta.env.DEV) console.warn('[EnhancedUnifiedDataService] Health check failed, clearing caches');
        this.clearCache();
      }
    }, 5 * 60 * 1000);
  }

  async fetchEmployees(currentUserEmail?: string): Promise<DataFetchResult<Employee>> {
    try {
      const result = await enhancedDataFetching.fetchEmployeesEnhanced(currentUserEmail);
      
      if (result.error) throw result.error;

      if (!result.data) {
        return { data: [], error: null, fromCache: result.fromCache || false, healthCheck: true };
      }

      const employees: Employee[] = result.data.map(profile => ({
        id: profile.id,
        name: profile.name || 'Unknown',
        email: profile.email || '',
        phone: profile.phone || '',
        jobTitle: profile.job_title || '',
        role: (profile as any).user_roles?.role || 'servicemedarbejder',
        onLeave: profile.on_leave || false,
        status: profile.status || 'active',
        notes: profile.notes || '',
        avatar_url: profile.avatar_url
      }));

      return { data: employees, error: null, fromCache: result.fromCache || false, healthCheck: true };
    } catch (error) {
      if (import.meta.env.DEV) console.error('[EnhancedUnifiedDataService] Employee fetch error:', error);
      
      const serializedError = enhancedErrorHandler.serializeError(error);
      const category = enhancedErrorHandler.categorizeError(serializedError);
      const errorMessage = enhancedErrorHandler.getUserFriendlyMessage(serializedError, category);
      
      await enhancedErrorHandler.logError(error, {
        operation: 'fetchEmployees',
        additionalData: { context: 'enhancedUnifiedDataService', category }
      });
      
      return { data: [], error: errorMessage, fromCache: false, healthCheck: false };
    }
  }

  async fetchAssignments(currentUserEmail?: string): Promise<DataFetchResult<Assignment>> {
    try {
      const result = await enhancedDataFetching.fetchAssignmentsEnhanced(currentUserEmail);
      
      if (result.error) throw result.error;

      if (!result.data) {
        return { data: [], error: null, fromCache: result.fromCache || false, healthCheck: true };
      }

      const assignments: Assignment[] = result.data.map(assignment => {
        const team = Array.isArray(assignment.team) ? assignment.team : [];
        const employees = team.map((emp: any) => emp.name || emp.email || 'Unknown User');
        
        const rawDate = assignment.assignment_date;
        let dateStr: string;

        if (!rawDate) {
          dateStr = '';
        } else if (rawDate instanceof Date) {
          dateStr = format(rawDate, 'yyyy-MM-dd');
        } else if (typeof rawDate === 'string') {
          dateStr = rawDate.split('T')[0];
        } else {
          dateStr = String(rawDate).split('T')[0];
        }
        
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: dateStr,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          employees: employees,
          assignedEmployees: team.map((emp: any) => ({
            id: emp.id,
            name: emp.name || 'Unknown User',
            email: emp.email || ''
          })),
          cars: assignment.car_ids || (assignment.car_id ? [assignment.car_id] : []),
          car: assignment.car_id || (assignment.car_ids && assignment.car_ids.length > 0 ? assignment.car_ids[0] : ''),
          published: assignment.published || false,
          responsibleUser: assignment.responsible_user,
          responsibleUserId: assignment.responsible_user_id,
          type: assignment.type || 'other',
          createdAt: assignment.created_at,
          updatedAt: assignment.updated_at
        };
      });

      return { data: assignments, error: null, fromCache: result.fromCache || false, healthCheck: true };
    } catch (error) {
      if (import.meta.env.DEV) console.error('[EnhancedUnifiedDataService] Assignment fetch error:', error);
      
      const serializedError = enhancedErrorHandler.serializeError(error);
      const category = enhancedErrorHandler.categorizeError(serializedError);
      const errorMessage = enhancedErrorHandler.getUserFriendlyMessage(serializedError, category);
      
      await enhancedErrorHandler.logError(error, {
        operation: 'fetchAssignments',
        additionalData: { context: 'enhancedUnifiedDataService', category }
      });
      
      return { data: [], error: errorMessage, fromCache: false, healthCheck: false };
    }
  }

  async fetchCars(currentUserEmail?: string): Promise<DataFetchResult<Car>> {
    try {
      const result = await enhancedDataFetching.fetchCarsEnhanced(currentUserEmail);
      
      if (result.error) throw result.error;

      const cars = result.data || [];

      return { data: cars, error: null, fromCache: result.fromCache || false, healthCheck: true };
    } catch (error) {
      if (import.meta.env.DEV) console.error('[EnhancedUnifiedDataService] Car fetch error:', error);
      
      const serializedError = enhancedErrorHandler.serializeError(error);
      const category = enhancedErrorHandler.categorizeError(serializedError);
      const errorMessage = enhancedErrorHandler.getUserFriendlyMessage(serializedError, category);
      
      await enhancedErrorHandler.logError(error, {
        operation: 'fetchCars',
        additionalData: { context: 'enhancedUnifiedDataService', category }
      });
      
      return { data: [], error: errorMessage, fromCache: false, healthCheck: false };
    }
  }

  clearCache(): void {
    if (import.meta.env.DEV) console.log('[EnhancedUnifiedDataService] Clearing enhanced data fetching cache...');
    enhancedDataFetching.clearCache();
  }

  getStatus() {
    return {
      ...enhancedDataFetching.getCircuitBreakerStatus(),
      healthMonitoring: !!this.healthCheckInterval,
      cacheEnabled: true,
      enhancedErrorHandling: true
    };
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export const enhancedUnifiedDataService = new EnhancedUnifiedDataService();
