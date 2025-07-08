import { SupabaseClient } from '@supabase/supabase-js';
import { DemoUserService } from './demoUserService';

// Demo data interceptor to automatically track operations
export class DemoDataInterceptor {
  private static instance: DemoDataInterceptor;
  private demoService: DemoUserService;
  private originalMethods: Map<string, any> = new Map();

  private constructor() {
    this.demoService = DemoUserService.getInstance();
  }

  static getInstance(): DemoDataInterceptor {
    if (!DemoDataInterceptor.instance) {
      DemoDataInterceptor.instance = new DemoDataInterceptor();
    }
    return DemoDataInterceptor.instance;
  }

  // Intercept Supabase operations for demo tracking
  interceptSupabaseClient(supabase: SupabaseClient, isDemoMode: boolean) {
    if (!isDemoMode) return;

    // Store original methods if not already stored
    if (!this.originalMethods.has('from')) {
      this.originalMethods.set('from', supabase.from.bind(supabase));
    }

    // Override the from method to intercept table operations
    supabase.from = ((tableName: string) => {
      const queryBuilder = this.originalMethods.get('from')(tableName);
      
      // Intercept insert operations
      const originalInsert = queryBuilder.insert.bind(queryBuilder);
      queryBuilder.insert = async (...args: any[]) => {
        const result = await originalInsert(...args);
        
        if (result.data && !result.error) {
          // Track created records
          const records = Array.isArray(result.data) ? result.data : [result.data];
          for (const record of records) {
            if (record?.id) {
              await this.demoService.trackOperation(tableName, 'create', record.id);
            }
          }
        }
        
        return result;
      };

      // Intercept update operations  
      const originalUpdate = queryBuilder.update.bind(queryBuilder);
      queryBuilder.update = async (...args: any[]) => {
        const result = await originalUpdate(...args);
        
        if (result.data && !result.error) {
          // Track updated records
          const records = Array.isArray(result.data) ? result.data : [result.data];
          for (const record of records) {
            if (record?.id) {
              await this.demoService.trackOperation(tableName, 'update', record.id, record);
            }
          }
        }
        
        return result;
      };

      // Intercept delete operations
      const originalDelete = queryBuilder.delete.bind(queryBuilder);
      queryBuilder.delete = async (...args: any[]) => {
        const result = await originalDelete(...args);
        
        if (result.data && !result.error) {
          // Track deleted records
          const records = Array.isArray(result.data) ? result.data : [result.data];
          for (const record of records) {
            if (record?.id) {
              await this.demoService.trackOperation(tableName, 'delete', record.id);
            }
          }
        }
        
        return result;
      };

      return queryBuilder;
    }).bind(supabase);
  }

  // Restore original Supabase methods
  restoreSupabaseClient(supabase: SupabaseClient) {
    if (this.originalMethods.has('from')) {
      supabase.from = this.originalMethods.get('from');
    }
  }
}

// Helper function to wrap database operations with demo tracking
export const withDemoTracking = async <T>(
  operation: () => Promise<T>,
  tableName: string,
  operationType: 'create' | 'update' | 'delete',
  recordId: string,
  originalData?: any
): Promise<T> => {
  const result = await operation();
  
  // Track the operation if in demo mode
  const demoService = DemoUserService.getInstance();
  const sessionId = demoService.getCurrentSessionId();
  
  if (sessionId) {
    await demoService.trackOperation(tableName, operationType, recordId, originalData);
  }
  
  return result;
};