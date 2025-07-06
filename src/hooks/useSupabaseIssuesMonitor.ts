/**
 * Phase 2: Hook for monitoring and resolving Supabase issues
 * Integrates with the comprehensive auditor to identify and resolve service-level problems
 */

import { useState, useEffect, useCallback } from 'react';
import { supabaseIssuesAuditor, type AuditReport } from '@/services/supabaseIssuesAuditor';
import { useToast } from '@/components/ui/use-toast';

interface MonitoringState {
  isAuditing: boolean;
  lastAudit: Date | null;
  auditReport: AuditReport | null;
  autoResolveEnabled: boolean;
  resolvedIssuesCount: number;
}

export const useSupabaseIssuesMonitor = () => {
  const [state, setState] = useState<MonitoringState>({
    isAuditing: false,
    lastAudit: null,
    auditReport: null,
    autoResolveEnabled: true,
    resolvedIssuesCount: 0
  });

  const { toast } = useToast();

  const runAudit = useCallback(async () => {
    if (state.isAuditing) {
      console.log('[useSupabaseIssuesMonitor] Audit already in progress');
      return;
    }

    console.log('[useSupabaseIssuesMonitor] Starting comprehensive Supabase audit...');
    
    setState(prev => ({ ...prev, isAuditing: true }));

    try {
      const auditReport = await supabaseIssuesAuditor.runComprehensiveAudit();
      
      console.log('[useSupabaseIssuesMonitor] Audit completed:', {
        totalIssues: auditReport.totalIssues,
        criticalIssues: auditReport.criticalIssues,
        warningIssues: auditReport.warningIssues
      });

      setState(prev => ({
        ...prev,
        isAuditing: false,
        lastAudit: new Date(),
        auditReport
      }));

      // Show toast notification based on audit results
      if (auditReport.criticalIssues > 0) {
        toast({
          title: '⚠️ Critical Issues Detected',
          description: `Found ${auditReport.criticalIssues} critical issues that need immediate attention`,
          variant: 'destructive'
        });
      } else if (auditReport.warningIssues > 0) {
        toast({
          title: '⚡ Issues Detected',
          description: `Found ${auditReport.warningIssues} issues that may affect performance`,
          variant: 'default'
        });
      } else if (auditReport.totalIssues === 0) {
        toast({
          title: '✅ System Healthy',
          description: 'No issues detected in Supabase services',
          variant: 'default'
        });
      }

      // Auto-resolve if enabled
      if (state.autoResolveEnabled && auditReport.totalIssues > 0) {
        await attemptAutoResolve(auditReport);
      }

      return auditReport;

    } catch (error) {
      console.error('[useSupabaseIssuesMonitor] Audit failed:', error);
      
      setState(prev => ({ ...prev, isAuditing: false }));
      
      toast({
        title: 'Audit Failed',
        description: 'Unable to complete system audit. Check console for details.',
        variant: 'destructive'
      });
      
      throw error;
    }
  }, [state.isAuditing, state.autoResolveEnabled, toast]);

  const attemptAutoResolve = useCallback(async (auditReport: AuditReport) => {
    console.log('[useSupabaseIssuesMonitor] Attempting auto-resolution of issues...');
    
    let resolvedCount = 0;

    // Auto-resolve authentication issues
    for (const issue of auditReport.services.authentication.issues) {
      if (issue.type === 'refresh_token_errors') {
        try {
          // Clear potentially stale sessions
          await clearStaleAuthSessions();
          resolvedCount++;
          console.log('[useSupabaseIssuesMonitor] Resolved: refresh_token_errors');
        } catch (error) {
          console.warn('[useSupabaseIssuesMonitor] Failed to resolve refresh_token_errors:', error);
        }
      }
    }

    // Auto-resolve real-time issues
    for (const issue of auditReport.services.realtime.issues) {
      if (issue.type === 'stale_realtime_channels') {
        try {
          // Clean up stale channels
          await cleanupStaleChannels();
          resolvedCount++;
          console.log('[useSupabaseIssuesMonitor] Resolved: stale_realtime_channels');
        } catch (error) {
          console.warn('[useSupabaseIssuesMonitor] Failed to resolve stale_realtime_channels:', error);
        }
      }
    }

    setState(prev => ({
      ...prev,
      resolvedIssuesCount: prev.resolvedIssuesCount + resolvedCount
    }));

    if (resolvedCount > 0) {
      toast({
        title: '🔧 Auto-Resolution Complete',
        description: `Automatically resolved ${resolvedCount} issues`,
        variant: 'default'
      });
    }

  }, [toast]);

  const clearStaleAuthSessions = useCallback(async () => {
    try {
      // Clear localStorage auth data
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-cyuyrpwtkljfiqwgasmn-auth-token');
      
      // Clear any other auth-related storage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') && key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });

      console.log('[useSupabaseIssuesMonitor] Cleared stale auth sessions');
    } catch (error) {
      console.error('[useSupabaseIssuesMonitor] Failed to clear stale sessions:', error);
      throw error;
    }
  }, []);

  const cleanupStaleChannels = useCallback(async () => {
    try {
      // Force cleanup of any hanging channels
      const supabaseInstance = (window as any).__supabaseClient;
      if (supabaseInstance && supabaseInstance.removeAllChannels) {
        supabaseInstance.removeAllChannels();
      }

      console.log('[useSupabaseIssuesMonitor] Cleaned up stale channels');
    } catch (error) {
      console.error('[useSupabaseIssuesMonitor] Failed to cleanup stale channels:', error);
      throw error;
    }
  }, []);

  const toggleAutoResolve = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      autoResolveEnabled: !prev.autoResolveEnabled 
    }));
  }, []);

  const resetStats = useCallback(() => {
    setState(prev => ({
      ...prev,
      resolvedIssuesCount: 0,
      lastAudit: null,
      auditReport: null
    }));
  }, []);

  // Periodic audit every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.isAuditing) {
        console.log('[useSupabaseIssuesMonitor] Running scheduled audit...');
        runAudit().catch(error => {
          console.warn('[useSupabaseIssuesMonitor] Scheduled audit failed:', error);
        });
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [state.isAuditing, runAudit]);

  return {
    // State
    isAuditing: state.isAuditing,
    lastAudit: state.lastAudit,
    auditReport: state.auditReport,
    autoResolveEnabled: state.autoResolveEnabled,
    resolvedIssuesCount: state.resolvedIssuesCount,
    
    // Actions
    runAudit,
    toggleAutoResolve,
    resetStats,
    
    // Computed values
    hasIssues: state.auditReport ? state.auditReport.totalIssues > 0 : false,
    hasCriticalIssues: state.auditReport ? state.auditReport.criticalIssues > 0 : false,
    systemHealthScore: state.auditReport ? calculateHealthScore(state.auditReport) : null
  };
};

function calculateHealthScore(auditReport: AuditReport): number {
  const totalPossibleIssues = 50; // Estimated maximum issues
  const criticalWeight = 3;
  const warningWeight = 1;
  
  const weightedIssues = (auditReport.criticalIssues * criticalWeight) + 
                        (auditReport.warningIssues * warningWeight);
  
  const score = Math.max(0, Math.min(100, 100 - (weightedIssues / totalPossibleIssues * 100)));
  
  return Math.round(score);
}