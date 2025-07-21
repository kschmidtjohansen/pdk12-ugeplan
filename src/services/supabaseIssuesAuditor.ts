/**
 * Phase 2: Comprehensive Supabase Issues Auditor
 * Identifies and resolves service-level issues that may not appear in application logs
 */

import { supabase } from '@/integrations/supabase/client';
import { enhancedErrorHandler } from './enhancedErrorHandler';

interface ServiceHealthResult {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    solution?: string;
  }>;
  lastChecked: string;
}

interface AuditReport {
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  services: {
    authentication: ServiceHealthResult;
    database: ServiceHealthResult;
    realtime: ServiceHealthResult;
    edgeFunctions: ServiceHealthResult;
    storage: ServiceHealthResult;
  };
  recommendations: string[];
  nextActions: string[];
}

export type { AuditReport };

export class SupabaseIssuesAuditor {
  private auditId: string;
  private readonly SUPABASE_URL = 'https://cyuyrpwtkljfiqwgasmn.supabase.co';
  
  constructor() {
    this.auditId = `audit_${Date.now()}`;
  }

  async runComprehensiveAudit(): Promise<AuditReport> {
    console.log(`[SupabaseIssuesAuditor] Starting comprehensive audit: ${this.auditId}`);
    
    const services = {
      authentication: await this.auditAuthenticationService(),
      database: await this.auditDatabaseService(),
      realtime: await this.auditRealtimeService(),
      edgeFunctions: await this.auditEdgeFunctions(),
      storage: await this.auditStorageService()
    };

    const totalIssues = Object.values(services).reduce((sum, service) => sum + service.issues.length, 0);
    const criticalIssues = Object.values(services).reduce((sum, service) => 
      sum + service.issues.filter(issue => issue.severity === 'critical').length, 0);
    const warningIssues = Object.values(services).reduce((sum, service) => 
      sum + service.issues.filter(issue => issue.severity === 'medium' || issue.severity === 'high').length, 0);

    const recommendations = this.generateRecommendations(services);
    const nextActions = this.generateNextActions(services);

    console.log(`[SupabaseIssuesAuditor] Audit complete: ${totalIssues} issues found (${criticalIssues} critical)`);

    return {
      totalIssues,
      criticalIssues,
      warningIssues,
      services,
      recommendations,
      nextActions
    };
  }

  private async auditAuthenticationService(): Promise<ServiceHealthResult> {
    const issues: ServiceHealthResult['issues'] = [];
    let status: ServiceHealthResult['status'] = 'healthy';

    try {
      // Test 1: Check for token refresh issues
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          issues.push({
            type: 'session_check_failed',
            severity: 'high',
            message: `Session validation failed: ${sessionError.message}`,
            solution: 'Clear browser sessions and implement proper token refresh handling'
          });
          status = 'error';
        } else if (!session) {
          issues.push({
            type: 'no_active_session',
            severity: 'medium',
            message: 'No active session found - expected for non-authenticated audit',
            solution: 'This is normal if running audit without authentication'
          });
        }
      } catch (authError) {
        issues.push({
          type: 'auth_service_error',
          severity: 'critical',
          message: `Authentication service error: ${authError}`,
          solution: 'Check Supabase authentication configuration and service status'
        });
        status = 'error';
      }

      // Test 2: Check for authentication timeout issues
      const startTime = Date.now();
      try {
        await supabase.auth.refreshSession();
      } catch (refreshError) {
        const duration = Date.now() - startTime;
        if (duration > 5000) {
          issues.push({
            type: 'auth_timeout',
            severity: 'high',
            message: `Authentication operations taking too long: ${duration}ms`,
            solution: 'Check network connectivity and Supabase service status'
          });
          status = 'warning';
        }
      }

      // Test 3: Check for excessive retry attempts
      const retryPattern = /refresh_token_not_found|Invalid Refresh Token/;
      if (retryPattern.test(JSON.stringify(await this.getRecentLogs()))) {
        issues.push({
          type: 'refresh_token_errors',
          severity: 'high',
          message: 'Detected refresh token errors in recent logs',
          solution: 'Implement enhanced session cleanup and token validation'
        });
        status = 'warning';
      }

    } catch (error) {
      issues.push({
        type: 'auth_audit_failed',
        severity: 'critical',
        message: `Authentication audit failed: ${error}`,
        solution: 'Investigate core authentication service issues'
      });
      status = 'error';
    }

    return {
      service: 'authentication',
      status,
      issues,
      lastChecked: new Date().toISOString()
    };
  }

  private async auditDatabaseService(): Promise<ServiceHealthResult> {
    const issues: ServiceHealthResult['issues'] = [];
    let status: ServiceHealthResult['status'] = 'healthy';

    try {
      // Test 1: Connection performance
      const startTime = Date.now();
      const { error: connectionError } = await supabase.from('profiles').select('count').limit(1);
      const connectionTime = Date.now() - startTime;

      if (connectionError) {
        issues.push({
          type: 'database_connection_failed',
          severity: 'critical',
          message: `Database connection failed: ${connectionError.message}`,
          solution: 'Check RLS policies and database service status'
        });
        status = 'error';
      }

      if (connectionTime > 2000) {
        issues.push({
          type: 'slow_database_response',
          severity: 'medium',
          message: `Database response time: ${connectionTime}ms (threshold: 2000ms)`,
          solution: 'Consider query optimization or check network latency'
        });
        status = 'warning';
      }

      // Test 2: Check for RLS policy issues
      try {
        const { error: rlsError } = await supabase.from('user_roles').select('role').limit(1);
        if (rlsError && rlsError.message.includes('permission')) {
          issues.push({
            type: 'rls_policy_restrictive',
            severity: 'high',
            message: 'RLS policies may be too restrictive for normal operations',
            solution: 'Review and optimize RLS policies for better performance'
          });
          status = 'warning';
        }
      } catch (rlsTestError) {
        // Expected for non-authenticated requests
      }

      // Test 3: Check for transaction lock issues
      try {
        const multiQueryStart = Date.now();
        await Promise.all([
          supabase.from('profiles').select('count').limit(1),
          supabase.from('assignments').select('count').limit(1),
          supabase.from('cars').select('count').limit(1)
        ]);
        const multiQueryTime = Date.now() - multiQueryStart;

        if (multiQueryTime > 5000) {
          issues.push({
            type: 'concurrent_query_slowdown',
            severity: 'medium',
            message: `Concurrent queries slow: ${multiQueryTime}ms`,
            solution: 'Check for database locks or connection pool issues'
          });
          status = 'warning';
        }
      } catch (concurrentError) {
        issues.push({
          type: 'concurrent_query_failed',
          severity: 'high',
          message: `Concurrent query test failed: ${concurrentError}`,
          solution: 'Check database connection limits and query optimization'
        });
        status = 'warning';
      }

    } catch (error) {
      issues.push({
        type: 'database_audit_failed',
        severity: 'critical',
        message: `Database audit failed: ${error}`,
        solution: 'Investigate core database connectivity issues'
      });
      status = 'error';
    }

    return {
      service: 'database',
      status,
      issues,
      lastChecked: new Date().toISOString()
    };
  }

  private async auditRealtimeService(): Promise<ServiceHealthResult> {
    const issues: ServiceHealthResult['issues'] = [];
    let status: ServiceHealthResult['status'] = 'healthy';

    try {
      // Test 1: Check channel connection
      const testChannel = supabase.channel('audit_test_channel');
      let channelConnected = false;
      let connectionTimeout = false;

      // Set up connection test with timeout
      const connectionPromise = new Promise<boolean>((resolve) => {
        testChannel.on('presence', { event: 'sync' }, () => {
          channelConnected = true;
          resolve(true);
        });

        testChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channelConnected = true;
            resolve(true);
          }
        });

        // 5-second timeout for connection
        setTimeout(() => {
          if (!channelConnected) {
            connectionTimeout = true;
            resolve(false);
          }
        }, 5000);
      });

      try {
        await connectionPromise;
        
        if (connectionTimeout) {
          issues.push({
            type: 'realtime_connection_timeout',
            severity: 'high',
            message: 'Real-time connection timed out after 5 seconds',
            solution: 'Check WebSocket connectivity and Supabase realtime service status'
          });
          status = 'warning';
        }

        // Clean up test channel
        supabase.removeChannel(testChannel);

      } catch (realtimeError) {
        issues.push({
          type: 'realtime_connection_failed',
          severity: 'high',
          message: `Real-time connection failed: ${realtimeError}`,
          solution: 'Check WebSocket support and network connectivity'
        });
        status = 'error';
      }

      // Test 2: Check for excessive channel subscriptions
      const channelCount = Object.keys((supabase as any)._channels || {}).length;
      if (channelCount > 20) {
        issues.push({
          type: 'excessive_channels',
          severity: 'medium',
          message: `High number of active channels: ${channelCount}`,
          solution: 'Review and clean up unused real-time subscriptions'
        });
        status = 'warning';
      }

      // Test 3: Check for memory leaks in subscriptions
      if (typeof (supabase as any).getChannels === 'function') {
        const channels = (supabase as any).getChannels();
        const staleChannels = channels.filter((ch: any) => 
          ch.state === 'closed' || 
          (Date.now() - (ch.lastActivity || 0)) > 300000 // 5 minutes
        );

        if (staleChannels.length > 0) {
          issues.push({
            type: 'stale_realtime_channels',
            severity: 'medium',
            message: `Found ${staleChannels.length} stale real-time channels`,
            solution: 'Implement proper channel cleanup in component unmount'
          });
          status = 'warning';
        }
      }

    } catch (error) {
      issues.push({
        type: 'realtime_audit_failed',
        severity: 'high',
        message: `Real-time audit failed: ${error}`,
        solution: 'Check real-time service configuration and connectivity'
      });
      status = 'error';
    }

    return {
      service: 'realtime',
      status,
      issues,
      lastChecked: new Date().toISOString()
    };
  }

  private async auditEdgeFunctions(): Promise<ServiceHealthResult> {
    const issues: ServiceHealthResult['issues'] = [];
    let status: ServiceHealthResult['status'] = 'healthy';

    // Test Edge Functions by attempting simple calls
    const edgeFunctions = [
      'admin-list-users',
      'admin-create-user', 
      'admin-delete-user',
      'admin-reset-password',
      'admin-user-role'
    ];

    for (const functionName of edgeFunctions) {
      try {
        // Test OPTIONS request (CORS preflight)
        const corsTestStart = Date.now();
        const corsResponse = await fetch(`${this.SUPABASE_URL}/functions/v1/${functionName}`, {
          method: 'OPTIONS',
          headers: {
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization, content-type'
          }
        });

        const corsTime = Date.now() - corsTestStart;

        if (!corsResponse.ok) {
          issues.push({
            type: 'edge_function_cors_failed',
            severity: 'high',
            message: `CORS preflight failed for ${functionName}: ${corsResponse.status}`,
            solution: 'Check edge function CORS configuration'
          });
          status = 'warning';
        }

        if (corsTime > 3000) {
          issues.push({
            type: 'edge_function_slow',
            severity: 'medium',
            message: `Edge function ${functionName} CORS slow: ${corsTime}ms`,
            solution: 'Monitor edge function performance and check cold start issues'
          });
          status = 'warning';
        }

      } catch (edgeFunctionError) {
        issues.push({
          type: 'edge_function_unreachable',
          severity: 'high',
          message: `Edge function ${functionName} unreachable: ${edgeFunctionError}`,
          solution: 'Check edge function deployment and network connectivity'
        });
        status = 'error';
      }
    }

    return {
      service: 'edgeFunctions',
      status,
      issues,
      lastChecked: new Date().toISOString()
    };
  }

  private async auditStorageService(): Promise<ServiceHealthResult> {
    const issues: ServiceHealthResult['issues'] = [];
    let status: ServiceHealthResult['status'] = 'healthy';

    try {
      // Test storage bucket accessibility
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      
      if (storageError) {
        issues.push({
          type: 'storage_access_failed',
          severity: 'medium',
          message: `Storage access failed: ${storageError.message}`,
          solution: 'Check storage service configuration and permissions'
        });
        status = 'warning';
      } else if (buckets && buckets.length > 0) {
        // Test each bucket
        for (const bucket of buckets) {
          try {
            const { error: bucketError } = await supabase.storage
              .from(bucket.name)
              .list('', { limit: 1 });
            
            if (bucketError && !bucketError.message.includes('does not exist')) {
              issues.push({
                type: 'storage_bucket_access_failed',
                severity: 'low',
                message: `Bucket ${bucket.name} access issues: ${bucketError.message}`,
                solution: 'Check bucket permissions and RLS policies'
              });
              status = 'warning';
            }
          } catch (bucketTestError) {
            // Expected for some buckets due to RLS
          }
        }
      }
    } catch (error) {
      issues.push({
        type: 'storage_audit_failed',
        severity: 'low',
        message: `Storage audit failed: ${error}`,
        solution: 'Storage service may not be configured or accessible'
      });
    }

    return {
      service: 'storage',
      status,
      issues,
      lastChecked: new Date().toISOString()
    };
  }

  private async getRecentLogs(): Promise<any[]> {
    try {
      // Try to get recent error logs from the application
      const { data: logs } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      return logs || [];
    } catch (error) {
      return [];
    }
  }

  private generateRecommendations(services: AuditReport['services']): string[] {
    const recommendations: string[] = [];
    
    // Authentication recommendations
    if (services.authentication.issues.some(i => i.type.includes('refresh_token'))) {
      recommendations.push('Implement enhanced session management with automatic cleanup of stale tokens');
    }
    
    if (services.authentication.issues.some(i => i.severity === 'critical')) {
      recommendations.push('Review authentication service configuration and check Supabase dashboard for service issues');
    }

    // Database recommendations
    if (services.database.issues.some(i => i.type.includes('slow'))) {
      recommendations.push('Optimize database queries and consider connection pooling improvements');
    }
    
    if (services.database.issues.some(i => i.type.includes('rls'))) {
      recommendations.push('Review and optimize RLS policies for better performance');
    }

    // Real-time recommendations
    if (services.realtime.issues.some(i => i.type.includes('channel'))) {
      recommendations.push('Implement proper real-time channel lifecycle management');
    }

    // Edge Functions recommendations
    if (services.edgeFunctions.issues.some(i => i.type.includes('slow'))) {
      recommendations.push('Monitor edge function cold starts and consider optimization strategies');
    }

    // General recommendations
    const totalCritical = Object.values(services).reduce((sum, service) => 
      sum + service.issues.filter(issue => issue.severity === 'critical').length, 0);
    
    if (totalCritical > 0) {
      recommendations.push('Address critical issues immediately to ensure system stability');
    }

    return recommendations;
  }

  private generateNextActions(services: AuditReport['services']): string[] {
    const actions: string[] = [];
    
    // Priority actions based on critical issues
    const criticalServices = Object.values(services).filter(service => 
      service.issues.some(issue => issue.severity === 'critical')
    );

    if (criticalServices.length > 0) {
      actions.push('Focus on resolving critical issues in: ' + criticalServices.map(s => s.service).join(', '));
    }

    // Monitoring actions
    actions.push('Set up automated monitoring for identified issues');
    actions.push('Schedule regular audits to prevent issue accumulation');
    
    // Performance actions
    if (Object.values(services).some(service => 
      service.issues.some(issue => issue.type.includes('slow'))
    )) {
      actions.push('Implement performance monitoring and alerting');
    }

    return actions;
  }
}

// Export singleton instance
export const supabaseIssuesAuditor = new SupabaseIssuesAuditor();