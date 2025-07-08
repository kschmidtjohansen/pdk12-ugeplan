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
  
  // Demo user configuration
  static readonly DEMO_USER_EMAIL = 'test@polygongroup.com';
  static readonly DEMO_USER_PASSWORD = 'TesterbrugerPlan123';
  
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
  
  // Clean up all demo data
  async cleanupDemoData(): Promise<{ success: boolean; errors: string[] }> {
    if (!this.demoSessionId) {
      return { success: true, errors: [] };
    }
    
    console.log('[Demo] Starting cleanup of demo data...');
    const errors: string[] = [];
    const operations = [...this.operationHistory].reverse(); // Reverse to handle dependencies
    
    // Group operations by table for efficient cleanup
    const operationsByTable = new Map<string, DemoOperation[]>();
    operations.forEach(op => {
      if (!operationsByTable.has(op.table)) {
        operationsByTable.set(op.table, []);
      }
      operationsByTable.get(op.table)!.push(op);
    });
    
    // Clean up each table
    for (const [table, tableOps] of operationsByTable) {
      try {
        await this.cleanupTableData(table, tableOps);
      } catch (error) {
        const errorMsg = `Failed to cleanup ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('[Demo]', errorMsg);
        errors.push(errorMsg);
      }
    }
    
    // Clear operation history
    this.operationHistory = [];
    this.saveOperationHistory();
    
    // Clear session storage
    sessionStorage.removeItem('demo-session-id');
    sessionStorage.removeItem('demo-operations');
    sessionStorage.removeItem('demo-role');
    
    const success = errors.length === 0;
    console.log(`[Demo] Cleanup completed. Success: ${success}, Errors: ${errors.length}`);
    
    return { success, errors };
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