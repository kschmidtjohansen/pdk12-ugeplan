
import { unifiedDataService } from './data/unifiedDataService';
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

  async fetchEmployees(): Promise<DataFetchResult<Employee>> {
    try {
      const result = await unifiedDataService.fetchEmployees();
      return {
        ...result,
        healthCheck: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        data: [],
        error: errorMessage,
        fromCache: false,
        healthCheck: false
      };
    }
  }

  async fetchAssignments(): Promise<DataFetchResult<Assignment>> {
    try {
      const result = await unifiedDataService.fetchAssignments();
      return {
        ...result,
        healthCheck: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        data: [],
        error: errorMessage,
        fromCache: false,
        healthCheck: false
      };
    }
  }

  async fetchCars(): Promise<DataFetchResult<Car>> {
    try {
      const result = await unifiedDataService.fetchCars();
      return {
        ...result,
        healthCheck: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        data: [],
        error: errorMessage,
        fromCache: false,
        healthCheck: false
      };
    }
  }

  clearCache(): void {
    unifiedDataService.clearCache();
  }

  getStatus() {
    return {
      ...unifiedDataService.getStatus(),
      healthMonitoring: !!this.healthCheckInterval
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
