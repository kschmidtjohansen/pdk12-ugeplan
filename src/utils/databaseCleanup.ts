
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from '@/utils/securityLogger';

export const cleanupFalsePositiveSecurityLogs = async (): Promise<{ success: boolean; deletedCount: number; error?: string }> => {
  try {
    if (import.meta.env.DEV) console.log('[DatabaseCleanup] Starting cleanup of false positive security logs...');
    
    const { data: deletedLogs, error } = await supabase
      .from('logs')
      .delete()
      .eq('event_type', 'suspicious_activity')
      .or('message.like.%mouse movement%,message.like.%rapid clicking%,message.like.%High frequency of activities%')
      .select('id');

    if (error) {
      console.error('[DatabaseCleanup] Error during cleanup:', error);
      return { success: false, deletedCount: 0, error: error.message };
    }

    const deletedCount = deletedLogs?.length || 0;
    
    await logSecurityEvent(
      'system_cleanup',
      `Cleaned up ${deletedCount} false positive security logs`,
      { 
        deletedCount,
        cleanupType: 'false_positive_removal',
        timestamp: new Date().toISOString()
      },
      'info'
    );

    if (import.meta.env.DEV) console.log(`[DatabaseCleanup] Successfully cleaned up ${deletedCount} false positive logs`);
    
    return { success: true, deletedCount };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during cleanup';
    console.error('[DatabaseCleanup] Unexpected error:', err);
    
    return { success: false, deletedCount: 0, error: errorMessage };
  }
};

export const cleanupOldSecurityLogs = async (daysToKeep: number = 30): Promise<{ success: boolean; deletedCount: number; error?: string }> => {
  try {
    if (import.meta.env.DEV) console.log(`[DatabaseCleanup] Cleaning up security logs older than ${daysToKeep} days...`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const { data: deletedLogs, error } = await supabase
      .from('logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .not('event_type', 'in', '(unauthorized_access,security_error,auth_failure)')
      .select('id');

    if (error) {
      console.error('[DatabaseCleanup] Error during old logs cleanup:', error);
      return { success: false, deletedCount: 0, error: error.message };
    }

    const deletedCount = deletedLogs?.length || 0;
    
    await logSecurityEvent(
      'system_cleanup',
      `Cleaned up ${deletedCount} old security logs (older than ${daysToKeep} days)`,
      { 
        deletedCount,
        daysToKeep,
        cleanupType: 'old_logs_removal',
        timestamp: new Date().toISOString()
      },
      'info'
    );

    if (import.meta.env.DEV) console.log(`[DatabaseCleanup] Successfully cleaned up ${deletedCount} old security logs`);
    
    return { success: true, deletedCount };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during cleanup';
    console.error('[DatabaseCleanup] Unexpected error:', err);
    
    return { success: false, deletedCount: 0, error: errorMessage };
  }
};

export const optimizeSecurityLogsTable = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (import.meta.env.DEV) console.log('[DatabaseCleanup] Optimizing security logs table...');
    
    await logSecurityEvent(
      'system_maintenance',
      'Security logs table optimization requested',
      { 
        timestamp: new Date().toISOString(),
        action: 'table_optimization'
      },
      'info'
    );

    if (import.meta.env.DEV) console.log('[DatabaseCleanup] Table optimization logged for admin review');
    
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during optimization';
    console.error('[DatabaseCleanup] Unexpected error:', err);
    
    return { success: false, error: errorMessage };
  }
};