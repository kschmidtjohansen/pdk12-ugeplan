
import { enhancedDataFetching } from './enhancedDataFetching';
import { enhancedErrorHandler } from './enhancedErrorHandler';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { systemHealthService } from './systemHealthService';

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
        console.warn('[EnhancedUnifiedDataService] Health check failed, clearing caches');
        this.clearCache();
      }
    }, 5 * 60 * 1000);
  }

  async fetchEmployees(currentUserEmail?: string): Promise<DataFetchResult<Employee>> {
    try {
      console.log('[EnhancedUnifiedDataService] Fetching employees with enhanced error handling...');
      
      // Use enhanced data fetching with proper error serialization
      const result = await enhancedDataFetching.fetchEmployeesEnhanced(currentUserEmail);
      
      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        return {
          data: [],
          error: null,
          fromCache: result.fromCache || false,
          healthCheck: true
        };
      }

      // Transform profiles to Employee format
      let employees: Employee[] = result.data.map(profile => ({
        id: profile.id,
        name: profile.name || 'Unknown',
        email: profile.email || '',
        phone: profile.phone || '',
        jobTitle: profile.job_title || '',
        role: 'servicemedarbejder', // Default role, will be enriched by role lookup
        onLeave: profile.on_leave || false,
        status: profile.status || 'active',
        notes: profile.notes || '',
        avatar_url: profile.avatar_url
      }));

      // Schema isolation handles data separation - no filtering needed

      console.log(`[EnhancedUnifiedDataService] Successfully fetched ${employees.length} employees`);

      return {
        data: employees,
        error: null,
        fromCache: result.fromCache || false,
        healthCheck: true
      };
    } catch (error) {
      console.error('[EnhancedUnifiedDataService] Employee fetch error:', error);
      
      // Enhanced error handling with proper serialization
      const serializedError = enhancedErrorHandler.serializeError(error);
      const category = enhancedErrorHandler.categorizeError(serializedError);
      const errorMessage = enhancedErrorHandler.getUserFriendlyMessage(serializedError, category);
      
      // Log error with enhanced context
      await enhancedErrorHandler.logError(error, {
        operation: 'fetchEmployees',
        additionalData: { 
          context: 'enhancedUnifiedDataService',
          category
        }
      });
      
      return {
        data: [],
        error: errorMessage,
        fromCache: false,
        healthCheck: false
      };
    }
  }

  async fetchAssignments(currentUserEmail?: string): Promise<DataFetchResult<Assignment>> {
    try {
      console.log('[EnhancedUnifiedDataService] Fetching assignments with enhanced error handling...');
      
      // Use enhanced data fetching with proper error serialization
      const result = await enhancedDataFetching.fetchAssignmentsEnhanced(currentUserEmail);
      
      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        return {
          data: [],
          error: null,
          fromCache: result.fromCache || false,
          healthCheck: true
        };
      }

      // Transform the data from the secure function response
      let assignments: Assignment[] = result.data.map(assignment => {
        const team = Array.isArray(assignment.team) ? assignment.team : [];
        const employees = team.map((emp: any) => emp.name || emp.email || 'Unknown User');
        
        // Debug logging for assignment employee data
        if (team.length > 0) {
          console.log(`[EnhancedUnifiedDataService] Assignment ${assignment.title} - Employee data:`, {
            teamCount: team.length,
            sampleTeamMember: team[0],
            allEmployeeNames: employees
          });
        }
        
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.assignment_date,
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

      // Schema isolation handles data separation - no filtering needed

      console.log(`[EnhancedUnifiedDataService] Successfully processed ${assignments.length} assignments`);

      return {
        data: assignments,
        error: null,
        fromCache: result.fromCache || false,
        healthCheck: true
      };
    } catch (error) {
      console.error('[EnhancedUnifiedDataService] Assignment fetch error:', error);
      
      // Enhanced error handling with proper serialization
      const serializedError = enhancedErrorHandler.serializeError(error);
      const category = enhancedErrorHandler.categorizeError(serializedError);
      const errorMessage = enhancedErrorHandler.getUserFriendlyMessage(serializedError, category);
      
      // Log error with enhanced context
      await enhancedErrorHandler.logError(error, {
        operation: 'fetchAssignments',
        additionalData: { 
          context: 'enhancedUnifiedDataService',
          category
        }
      });
      
      return {
        data: [],
        error: errorMessage,
        fromCache: false,
        healthCheck: false
      };
    }
  }

  async fetchCars(currentUserEmail?: string): Promise<DataFetchResult<Car>> {
    try {
      console.log('[EnhancedUnifiedDataService] Fetching cars with enhanced error handling...');
      
      // Use enhanced data fetching with proper error serialization
      const result = await enhancedDataFetching.fetchCarsEnhanced(currentUserEmail);
      
      if (result.error) {
        throw result.error;
      }

      const cars = result.data || [];
      console.log(`[EnhancedUnifiedDataService] Successfully fetched ${cars.length} cars`);

      return {
        data: cars,
        error: null,
        fromCache: result.fromCache || false,
        healthCheck: true
      };
    } catch (error) {
      console.error('[EnhancedUnifiedDataService] Car fetch error:', error);
      
      // Enhanced error handling with proper serialization
      const serializedError = enhancedErrorHandler.serializeError(error);
      const category = enhancedErrorHandler.categorizeError(serializedError);
      const errorMessage = enhancedErrorHandler.getUserFriendlyMessage(serializedError, category);
      
      // Log error with enhanced context
      await enhancedErrorHandler.logError(error, {
        operation: 'fetchCars',
        additionalData: { 
          context: 'enhancedUnifiedDataService',
          category
        }
      });
      
      return {
        data: [],
        error: errorMessage,
        fromCache: false,
        healthCheck: false
      };
    }
  }

  clearCache(): void {
    console.log('[EnhancedUnifiedDataService] Clearing enhanced data fetching cache...');
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
