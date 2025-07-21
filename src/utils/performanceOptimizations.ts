// Performance optimization utilities for Phase 2

// Debounce utility for reducing excessive API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

// Throttle utility for rate limiting
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Batch processing utility for handling multiple operations
export async function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    try {
      const batchResults = await processor(batch);
      results.push(...batchResults);
    } catch (error) {
      console.error(`[batchProcess] Error processing batch ${i / batchSize + 1}:`, error);
      // Continue with next batch rather than failing entirely
    }
  }
  
  return results;
}

// Memory-efficient data transformation
export function transformAssignmentData(rawData: any[]): any[] {
  // Use Map for O(1) lookups instead of find operations
  const employeeMap = new Map();
  const carMap = new Map();
  
  return rawData.map(assignment => {
    // Cache employee and car lookups
    const employeeKey = `${assignment.id}_employees`;
    const carKey = assignment.car_id || assignment.car_ids?.[0];
    
    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description || '',
      date: assignment.assignment_date,
      fromTime: assignment.from_time,
      toTime: assignment.to_time,
      location: assignment.location,
      published: assignment.published || false,
      // Optimized data transformation continues here
    };
  });
}

// Query optimization helpers
export const QueryOptimizations = {
  // Common select patterns to reduce over-fetching
  ASSIGNMENT_SELECT: `
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
    updated_at
  `,
  
  PROFILE_SELECT: `
    id,
    name,
    email,
    phone,
    job_title,
    on_leave,
    notes,
    avatar_url
  `,
  
  CAR_SELECT: `
    id,
    name,
    car_number,
    number_plate,
    is_available
  `,
  
  // Optimized join patterns
  ASSIGNMENT_WITH_RELATIONS: `
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
    cars:car_id (id, name, car_number),
    responsible_user:responsible_user_id (id, name)
  `
};

// Error recovery utilities
export class ErrorRecovery {
  private static retryCount = new Map<string, number>();
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  static async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    const currentRetries = this.retryCount.get(operationId) || 0;
    
    try {
      const result = await operation();
      // Reset retry count on success
      this.retryCount.delete(operationId);
      return result;
    } catch (error) {
      if (currentRetries < maxRetries) {
        console.log(`[ErrorRecovery] Retrying operation ${operationId}, attempt ${currentRetries + 1}/${maxRetries}`);
        this.retryCount.set(operationId, currentRetries + 1);
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, currentRetries))
        );
        
        return this.withRetry(operation, operationId, maxRetries);
      } else {
        // Max retries reached, reset counter and throw
        this.retryCount.delete(operationId);
        throw error;
      }
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();

  static startTimer(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMeasurement(operation, duration);
    };
  }

  private static recordMeasurement(operation: string, duration: number) {
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, []);
    }
    
    const measurements = this.measurements.get(operation)!;
    measurements.push(duration);
    
    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift();
    }
    
    // Log slow operations
    if (duration > 2000) { // 2 seconds
      console.warn(`[PerformanceMonitor] Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  static getStats(operation: string) {
    const measurements = this.measurements.get(operation) || [];
    if (measurements.length === 0) return null;
    
    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    return { avg, min, max, count: measurements.length };
  }
}
