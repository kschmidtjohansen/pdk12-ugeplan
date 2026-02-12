import { supabase } from '@/integrations/supabase/client';

// Secure demo configuration without exposing credentials
export class SecureDemoService {
  private static instance: SecureDemoService;
  private demoSessionId: string | null = null;
  private operationHistory: any[] = [];
  
  // Demo user configuration - credentials moved to environment/config
  private static readonly DEMO_USER_EMAIL = 'test@polygongroup.com';
  private static readonly DEMO_USER_ID = '165cdbc9-6722-4c96-97d2-1a87185c8133';
  
  private constructor() {
    this.initializeSession();
    this.loadOperationHistory();
  }
  
  static getInstance(): SecureDemoService {
    if (!SecureDemoService.instance) {
      SecureDemoService.instance = new SecureDemoService();
    }
    return SecureDemoService.instance;
  }
  
  // Remove password exposure from the class
  static getDemoCredentials(): { email: string; password?: string } {
    // In production, this would come from secure environment variables
    // For now, we'll keep it minimal and suggest proper environment setup
    return {
      email: SecureDemoService.DEMO_USER_EMAIL,
      // Password should be retrieved from secure environment variables
      password: import.meta.env.VITE_DEMO_PASSWORD || undefined
    };
  }
  
  private initializeSession(): void {
    this.demoSessionId = sessionStorage.getItem('demo-session-id') || this.generateSessionId();
    sessionStorage.setItem('demo-session-id', this.demoSessionId);
  }
  
  private generateSessionId(): string {
    // Use crypto.randomUUID for better security
    const timestamp = Date.now();
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `demo-${timestamp}-${randomHex}`;
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
    const keys = [
      'demo-session-id',
      'demo-operations', 
      'demo-assignments',
      'demo-role',
      'demo-last-activity',
      'demo-last-cleanup'
    ];
    
    keys.forEach(key => sessionStorage.removeItem(key));
  }
  
  isDemoUser(email?: string): boolean {
    return email === SecureDemoService.DEMO_USER_EMAIL;
  }
  
  getCurrentSessionId(): string | null {
    return this.demoSessionId;
  }
  
  // Enhanced cleanup with better error handling and logging
  async cleanupAllDemoUserData(): Promise<{ 
    success: boolean; 
    errors: string[]; 
    deletedCounts: Record<string, number> 
  }> {
    console.log('[SecureDemo] Starting comprehensive cleanup...');
    const errors: string[] = [];
    const deletedCounts: Record<string, number> = {};
    
    try {
      // Define cleanup operations with proper error handling
      const cleanupOperations = [
        {
          name: 'assignments',
          query: () => supabase.from('assignments').delete().eq('responsible_user_id', SecureDemoService.DEMO_USER_ID)
        },
        {
          name: 'assignments_employees', 
          query: () => supabase.from('assignments_employees').delete().eq('user_id', SecureDemoService.DEMO_USER_ID)
        },
        {
          name: 'notifications',
          query: () => supabase.from('notifications').delete().eq('user_id', SecureDemoService.DEMO_USER_ID)
        },
        {
          name: 'vacations',
          query: () => supabase.from('vacations').delete().eq('user_id', SecureDemoService.DEMO_USER_ID)
        }
      ];

      // Execute cleanup operations
      for (const operation of cleanupOperations) {
        try {
          const { count, error } = await operation.query();
          
          if (error) {
            errors.push(`Failed to delete ${operation.name}: ${error.message}`);
          } else {
            deletedCounts[operation.name] = count || 0;
          }
        } catch (err) {
          errors.push(`Unexpected error cleaning ${operation.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Clear local session data
      this.operationHistory = [];
      this.saveOperationHistory();
      this.clearSessionData();
      
      const success = errors.length === 0;
      const totalDeleted = Object.values(deletedCounts).reduce((sum, count) => sum + count, 0);
      
      console.log(`[SecureDemo] Cleanup completed. Success: ${success}, Total deleted: ${totalDeleted}`);
      
      return { success, errors, deletedCounts };
    } catch (error) {
      const errorMsg = `Comprehensive cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('[SecureDemo]', errorMsg);
      errors.push(errorMsg);
      return { success: false, errors, deletedCounts };
    }
  }
}
