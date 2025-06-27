
import { supabase } from '@/integrations/supabase/client';
import { secureLog, secureError } from './secureLogger';
import { AuditLogger } from './auditLogger';

export class DataRetentionManager {
  // Data retention periods (in days)
  private static readonly RETENTION_PERIODS = {
    logs: 90,              // Keep logs for 3 months
    rejectedVacations: 14, // Keep rejected vacation requests for 2 weeks
    expiredVacations: 0,   // Remove expired approved vacations immediately
    oldNotifications: 30,  // Keep notifications for 1 month
    auditTrail: 365       // Keep audit trail for 1 year
  };

  // Clean up old logs
  static async cleanupOldLogs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_PERIODS.logs);

      const { data, error } = await supabase
        .from('logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      const recordsAffected = data?.length || 0;

      secureLog('Old logs cleanup completed', {
        cutoffDate: cutoffDate.toISOString(),
        recordsAffected
      });

      await AuditLogger.logAdminAction('cleanup', 'logs', undefined, {
        cutoffDate: cutoffDate.toISOString(),
        recordsDeleted: recordsAffected
      });

    } catch (error) {
      secureError('Failed to cleanup old logs', error);
    }
  }

  // Clean up old notifications
  static async cleanupOldNotifications(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_PERIODS.oldNotifications);

      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('read', true)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      const recordsAffected = data?.length || 0;

      secureLog('Old notifications cleanup completed', {
        cutoffDate: cutoffDate.toISOString(),
        recordsAffected
      });

      await AuditLogger.logAdminAction('cleanup', 'notifications', undefined, {
        cutoffDate: cutoffDate.toISOString(),
        recordsDeleted: recordsAffected
      });

    } catch (error) {
      secureError('Failed to cleanup old notifications', error);
    }
  }

  // Clean up user data (GDPR compliance)
  static async cleanupUserData(userId: string): Promise<void> {
    try {
      secureLog('Starting user data cleanup', { userId });

      // List of tables that might contain user data
      const cleanupOperations = [
        // Clean up user's notifications
        supabase.from('notifications').delete().eq('user_id', userId),
        
        // Clean up user's vacation requests (only if very old)
        supabase.from('vacations')
          .delete()
          .eq('user_id', userId)
          .lt('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Remove user from assignment relationships
        supabase.from('assignments_employees').delete().eq('user_id', userId),
        
        // Clean up user role
        supabase.from('user_roles').delete().eq('user_id', userId),
        
        // Finally, clean up user profile
        supabase.from('profiles').delete().eq('id', userId)
      ];

      const results = await Promise.allSettled(cleanupOperations);
      
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          secureError(`User data cleanup operation ${index} failed`, result.reason);
        }
      });

      await AuditLogger.logAdminAction('cleanup', 'user_data', userId, {
        operation: 'full_user_data_cleanup',
        operationsCount: cleanupOperations.length
      });

      secureLog('User data cleanup completed', { userId });

    } catch (error) {
      secureError('Failed to cleanup user data', error, { userId });
    }
  }

  // Clear sensitive localStorage data
  static clearSensitiveLocalStorage(): void {
    const sensitiveKeys = [
      'temp_password',
      'remember_me_token',
      'last_auth_attempt',
      'user_sessions',
      'cached_sensitive_data'
    ];

    let clearedCount = 0;
    sensitiveKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });

    if (clearedCount > 0) {
      secureLog('Sensitive localStorage data cleared', { itemsCleared: clearedCount });
    }
  }

  // Run all cleanup operations
  static async runFullCleanup(): Promise<void> {
    secureLog('Starting full data retention cleanup');

    try {
      await Promise.all([
        this.cleanupOldLogs(),
        this.cleanupOldNotifications()
      ]);

      this.clearSensitiveLocalStorage();

      secureLog('Full data retention cleanup completed');

    } catch (error) {
      secureError('Full cleanup failed', error);
    }
  }

  // Schedule periodic cleanup (call this on app initialization)
  static schedulePeriodicCleanup(): void {
    // Run cleanup once per day
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

    setInterval(() => {
      this.runFullCleanup();
    }, CLEANUP_INTERVAL);

    // Run initial cleanup after 5 minutes
    setTimeout(() => {
      this.runFullCleanup();
    }, 5 * 60 * 1000);
  }
}
