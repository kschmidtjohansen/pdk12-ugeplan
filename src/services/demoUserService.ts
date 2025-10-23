import { supabase } from '@/integrations/supabase/client';

// Demo operation types
export interface DemoOperation {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  recordId: string;
  originalData?: any;
  timestamp: string;
  sessionId: string;
}

export interface DemoDataStats {
  totalOperations: number;
  createdRecords: number;
  updatedRecords: number;
  deletedRecords: number;
  tablesAffected: string[];
}

// Demo user service for managing demo mode functionality
export class DemoUserService {
  private static instance: DemoUserService;
  private demoSessionId: string | null = null;
  private operationHistory: DemoOperation[] = [];
  
  // Demo user configuration - credentials moved to secure config
  static readonly DEMO_USER_EMAIL = 'test@polygongroup.com';
  static readonly DEMO_USER_ID = '165cdbc9-6722-4c96-97d2-1a87185c8133';
  
  // SECURITY NOTE: Password moved to secure configuration
  // In production, demo credentials should be environment variables
  
  private constructor() {
    this.initializeSession();
    this.loadOperationHistory();
  }
  
  static getInstance(): DemoUserService {
    if (!DemoUserService.instance) {
      DemoUserService.instance = new DemoUserService();
    }
    return DemoUserService.instance;
  }
  
  private initializeSession(): void {
    // Generate or retrieve demo session ID
    this.demoSessionId = sessionStorage.getItem('demo-session-id') || this.generateSessionId();
    sessionStorage.setItem('demo-session-id', this.demoSessionId);
  }
  
  private generateSessionId(): string {
    return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private loadOperationHistory(): void {
    const stored = sessionStorage.getItem('demo-operations');
    if (stored) {
      try {
        this.operationHistory = JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to load demo operation history:', error);
        this.operationHistory = [];
      }
    }
  }
  
  private saveOperationHistory(): void {
    try {
      sessionStorage.setItem('demo-operations', JSON.stringify(this.operationHistory));
    } catch (error) {
      console.warn('Failed to save demo operation history:', error);
    }
  }

  private clearSessionData(): void {
    sessionStorage.removeItem('demo-session-id');
    sessionStorage.removeItem('demo-operations');
    sessionStorage.removeItem('demo-assignments');
    sessionStorage.removeItem('demo-cars');
    sessionStorage.removeItem('demo-role');
    sessionStorage.removeItem('demo-last-activity');
    sessionStorage.removeItem('demo-last-cleanup');
  }
  
  isDemoUser(email?: string): boolean {
    return email === DemoUserService.DEMO_USER_EMAIL;
  }
  
  getCurrentSessionId(): string | null {
    return this.demoSessionId;
  }
  
  // Track demo operations
  async trackOperation(
    table: string,
    operation: 'create' | 'update' | 'delete',
    recordId: string,
    originalData?: any
  ): Promise<void> {
    if (!this.demoSessionId) return;
    
    const demoOp: DemoOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      table,
      operation,
      recordId,
      originalData: operation === 'update' ? originalData : undefined,
      timestamp: new Date().toISOString(),
      sessionId: this.demoSessionId
    };
    
    this.operationHistory.push(demoOp);
    this.saveOperationHistory();
    
    console.log(`[Demo] Tracked ${operation} operation on ${table}:`, recordId);
  }

  // Store demo assignment data in session storage
  storeDemoAssignment(assignment: any): void {
    const demoAssignments = this.getDemoAssignments();
    demoAssignments.push({
      ...assignment,
      id: assignment.id || `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isDemoData: true,
      sessionId: this.demoSessionId
    });
    sessionStorage.setItem('demo-assignments', JSON.stringify(demoAssignments));
  }

  // Update demo assignment in session storage
  updateDemoAssignment(id: string, updates: any): void {
    const demoAssignments = this.getDemoAssignments();
    const index = demoAssignments.findIndex(a => a.id === id);
    if (index !== -1) {
      demoAssignments[index] = { ...demoAssignments[index], ...updates };
      sessionStorage.setItem('demo-assignments', JSON.stringify(demoAssignments));
    }
  }

  // Delete demo assignment from session storage
  deleteDemoAssignment(id: string): void {
    const demoAssignments = this.getDemoAssignments();
    const filtered = demoAssignments.filter(a => a.id !== id);
    sessionStorage.setItem('demo-assignments', JSON.stringify(filtered));
  }

  // Get demo assignments from session storage
  getDemoAssignments(): any[] {
    const stored = sessionStorage.getItem('demo-assignments');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to load demo assignments:', error);
        return [];
      }
    }
    return [];
  }
  
  // Demo cars storage helpers
  storeDemoCar(car: any): void {
    const cars = this.getDemoCars();
    const record = {
      ...car,
      id: car.id || `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isDemoData: true,
      sessionId: this.demoSessionId
    };
    cars.push(record);
    sessionStorage.setItem('demo-cars', JSON.stringify(cars));
  }
  
  updateDemoCar(id: string, updates: any): void {
    const cars = this.getDemoCars();
    const idx = cars.findIndex((c: any) => c.id === id);
    if (idx !== -1) {
      cars[idx] = { ...cars[idx], ...updates, updated_at: new Date().toISOString() };
      sessionStorage.setItem('demo-cars', JSON.stringify(cars));
    }
  }
  
  deleteDemoCar(id: string): void {
    const cars = this.getDemoCars();
    const filtered = cars.filter((c: any) => c.id !== id);
    sessionStorage.setItem('demo-cars', JSON.stringify(filtered));
  }
  
  getDemoCars(): any[] {
    const stored = sessionStorage.getItem('demo-cars');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse demo cars from storage', e);
      return [];
    }
  }
  
  // Get demo data statistics
  getDemoStats(): DemoDataStats {
    const operations = this.operationHistory;
    
    return {
      totalOperations: operations.length,
      createdRecords: operations.filter(op => op.operation === 'create').length,
      updatedRecords: operations.filter(op => op.operation === 'update').length,
      deletedRecords: operations.filter(op => op.operation === 'delete').length,
      tablesAffected: [...new Set(operations.map(op => op.table))]
    };
  }
  
  // Get operations for a specific table
  getOperationsForTable(table: string): DemoOperation[] {
    return this.operationHistory.filter(op => op.table === table);
  }
  
  // Clean up all demo data using schema-based cleanup (preserves baseline data)
  async cleanupAllDemoUserData(): Promise<{ success: boolean; errors: string[]; deletedCounts: Record<string, number> }> {
    console.log('[Demo] Starting cleanup of session data (preserving baseline)...');
    const errors: string[] = [];
    const deletedCounts: Record<string, number> = {};
    
    try {
      // Call database function to clean up only session data
      const { data, error } = await supabase.rpc('cleanup_session_data' as any, {
        baseline_timestamp: '2024-01-01T00:00:00Z'
      });
      
      if (error) {
        errors.push(`Cleanup function failed: ${error.message}`);
        return { success: false, errors, deletedCounts };
      }
      
      // Extract deletion counts from function result
      if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0] as any;
        deletedCounts.assignments = result.deleted_assignments || 0;
        deletedCounts.notifications = result.deleted_notifications || 0;
        deletedCounts.vacations = result.deleted_vacations || 0;
        deletedCounts.warehouse_items = result.deleted_warehouse || 0;
      }
      
      // Clear virtual demo data from sessionStorage
      sessionStorage.removeItem('demo-assignments');
      sessionStorage.removeItem('demo-cars');
      sessionStorage.removeItem('demo-vacations');
      console.log('[Demo] Cleared local virtual demo data from sessionStorage');
      
      // Clear session storage (but keep session ID for continuity)
      sessionStorage.removeItem('demo-operations');
      this.operationHistory = [];
      this.saveOperationHistory();
      
      const totalDeleted = Object.values(deletedCounts).reduce((sum, count) => sum + count, 0);
      console.log(`[Demo] Cleanup completed. Total deleted: ${totalDeleted}, Baseline data preserved.`);
      
      return { success: true, errors: [], deletedCounts };
    } catch (error) {
      const errorMsg = `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('[Demo]', errorMsg);
      errors.push(errorMsg);
      return { success: false, errors, deletedCounts };
    }
  }

  // Legacy cleanup method (for backwards compatibility)
  async cleanupDemoData(): Promise<{ success: boolean; errors: string[] }> {
    const result = await this.cleanupAllDemoUserData();
    return { success: result.success, errors: result.errors };
  }
  
  private async cleanupTableData(table: string, operations: DemoOperation[]): Promise<void> {
    // Get only create operations (records that were created by demo user)
    const createdRecords = operations
      .filter(op => op.operation === 'create')
      .map(op => op.recordId);
    
    if (createdRecords.length === 0) {
      return;
    }
    
    try {
      // Delete records in batches to avoid query limits
      const batchSize = 50;
      for (let i = 0; i < createdRecords.length; i += batchSize) {
        const batch = createdRecords.slice(i, i + batchSize);
        
        // Type-safe table deletion using a switch statement
        let deletePromise;
        switch (table) {
          case 'assignments':
            deletePromise = supabase.from('assignments').delete().in('id', batch);
            break;
          case 'cars':
            deletePromise = supabase.from('cars').delete().in('id', batch);
            break;
          case 'profiles':
            deletePromise = supabase.from('profiles').delete().in('id', batch);
            break;
          case 'notifications':
            deletePromise = supabase.from('notifications').delete().in('id', batch);
            break;
          case 'vacations':
            deletePromise = supabase.from('vacations').delete().in('id', batch);
            break;
          case 'assignments_employees':
            deletePromise = supabase.from('assignments_employees').delete().in('assignment_id', batch);
            break;
          default:
            console.warn(`[Demo] Unknown table for cleanup: ${table}`);
            continue;
        }
        
        const { error } = await deletePromise;
        
        if (error) {
          throw error;
        }
        
        console.log(`[Demo] Deleted ${batch.length} records from ${table}`);
      }
    } catch (error) {
      console.error(`[Demo] Error cleaning up ${table}:`, error);
      throw error;
    }
  }
  
  // Manual cleanup trigger
  async triggerManualCleanup(): Promise<void> {
    const result = await this.cleanupDemoData();
    
    if (!result.success) {
      throw new Error(`Cleanup failed with errors: ${result.errors.join(', ')}`);
    }
  }
  
  // Check if current session should be cleaned up
  shouldAutoCleanup(): boolean {
    // Auto cleanup after 4 hours of inactivity
    const lastActivity = sessionStorage.getItem('demo-last-activity');
    if (!lastActivity) return false;
    
    const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
    return parseInt(lastActivity) < fourHoursAgo;
  }
  
  // Update activity timestamp
  updateActivity(): void {
    sessionStorage.setItem('demo-last-activity', Date.now().toString());
  }
  
  // Reset session (for switching users)
  async resetSession(): Promise<void> {
    await this.cleanupDemoData();
    this.demoSessionId = this.generateSessionId();
    sessionStorage.setItem('demo-session-id', this.demoSessionId);
  }
}