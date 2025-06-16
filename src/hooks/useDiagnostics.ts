
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface DiagnosticResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

interface DiagnosticSummary {
  results: DiagnosticResult[];
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  isLoading: boolean;
  lastRun: Date | null;
}

export const useDiagnostics = () => {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticSummary>({
    results: [],
    totalIssues: 0,
    criticalIssues: 0,
    warningIssues: 0,
    isLoading: false,
    lastRun: null
  });

  const runDiagnostics = useCallback(async () => {
    if (!user) return;
    
    setDiagnostics(prev => ({ ...prev, isLoading: true }));
    const results: DiagnosticResult[] = [];

    try {
      console.log('[useDiagnostics] Starting comprehensive diagnostics...');

      // Test 1: Database Connectivity
      try {
        const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
        results.push({
          category: 'Database',
          status: dbError ? 'fail' : 'pass',
          message: dbError ? `Database connection failed: ${dbError.message}` : 'Database connection successful'
        });
      } catch (err) {
        results.push({
          category: 'Database',
          status: 'fail',
          message: `Database test failed: ${err}`
        });
      }

      // Test 2: Authentication System
      try {
        const { data: session } = await supabase.auth.getSession();
        results.push({
          category: 'Authentication',
          status: session ? 'pass' : 'warning',
          message: session ? 'User authenticated successfully' : 'No active session'
        });
      } catch (err) {
        results.push({
          category: 'Authentication',
          status: 'fail',
          message: `Auth system error: ${err}`
        });
      }

      // Test 3: RLS Policies
      try {
        const { data: assignments, error: assignError } = await supabase
          .from('assignments')
          .select('id')
          .limit(1);
        
        results.push({
          category: 'RLS_Policies',
          status: assignError ? 'fail' : 'pass',
          message: assignError ? `RLS policy issue: ${assignError.message}` : 'RLS policies working correctly'
        });
      } catch (err) {
        results.push({
          category: 'RLS_Policies',
          status: 'fail',
          message: `RLS test failed: ${err}`
        });
      }

      // Test 4: System Health Function
      try {
        const { data: healthData, error: healthError } = await supabase.rpc('check_system_health');
        results.push({
          category: 'System_Health',
          status: healthError ? 'fail' : 'pass',
          message: healthError ? `System health check failed: ${healthError.message}` : 'System health functions operational',
          details: healthData
        });
      } catch (err) {
        results.push({
          category: 'System_Health',
          status: 'fail',
          message: `Health function error: ${err}`
        });
      }

      // Test 5: User Roles and Permissions
      try {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        results.push({
          category: 'User_Roles',
          status: roleError ? 'warning' : 'pass',
          message: roleError ? `Role validation issue: ${roleError.message}` : `User role: ${roleData?.role || 'undefined'}`
        });
      } catch (err) {
        results.push({
          category: 'User_Roles',
          status: 'fail',
          message: `Role system error: ${err}`
        });
      }

      // Test 6: Real-time Connectivity
      try {
        const channel = supabase.channel('diagnostic-test');
        const isConnected = channel.socket.isConnected();
        results.push({
          category: 'Realtime',
          status: isConnected ? 'pass' : 'warning',
          message: isConnected ? 'Real-time connection active' : 'Real-time connection inactive'
        });
        supabase.removeChannel(channel);
      } catch (err) {
        results.push({
          category: 'Realtime',
          status: 'fail',
          message: `Real-time test failed: ${err}`
        });
      }

      // Test 7: Security Logging
      try {
        const { data: logData, error: logError } = await supabase
          .from('logs')
          .select('count')
          .limit(1);

        results.push({
          category: 'Security_Logging',
          status: logError ? 'fail' : 'pass',
          message: logError ? `Logging system error: ${logError.message}` : 'Security logging functional'
        });
      } catch (err) {
        results.push({
          category: 'Security_Logging',
          status: 'warning',
          message: `Log test failed: ${err}`
        });
      }

      // Calculate summary
      const criticalIssues = results.filter(r => r.status === 'fail').length;
      const warningIssues = results.filter(r => r.status === 'warning').length;
      const totalIssues = criticalIssues + warningIssues;

      setDiagnostics({
        results,
        totalIssues,
        criticalIssues,
        warningIssues,
        isLoading: false,
        lastRun: new Date()
      });

      console.log('[useDiagnostics] Diagnostics completed:', { totalIssues, criticalIssues, warningIssues });

    } catch (error) {
      console.error('[useDiagnostics] Diagnostic run failed:', error);
      setDiagnostics(prev => ({
        ...prev,
        isLoading: false,
        results: [{
          category: 'System',
          status: 'fail',
          message: `Diagnostic system error: ${error}`
        }],
        totalIssues: 1,
        criticalIssues: 1,
        warningIssues: 0
      }));
    }
  }, [user]);

  // Auto-run diagnostics on mount
  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user, runDiagnostics]);

  return {
    diagnostics,
    runDiagnostics,
    isHealthy: diagnostics.criticalIssues === 0
  };
};
