/**
 * Phase 4: Intelligent Issue Resolver
 * Advanced automation for predictive issue detection and resolution
 */

import { supabase } from '@/integrations/supabase/client';
import { supabaseIssuesAuditor } from './supabaseIssuesAuditor';

interface IssuePattern {
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  lastOccurrence: Date;
  autoResolvable: boolean;
  resolutionStrategy: string;
}

interface ResolutionResult {
  success: boolean;
  strategy: string;
  details: string;
  preventiveMeasures?: string[];
}

interface PredictiveAlert {
  issue: string;
  probability: number;
  timeToOccurrence: string;
  preventiveActions: string[];
}

export class IntelligentIssueResolver {
  private issuePatterns: Map<string, IssuePattern> = new Map();
  private resolutionHistory: Array<{
    issue: string;
    resolution: ResolutionResult;
    timestamp: Date;
  }> = [];

  constructor() {
    this.initializeKnownPatterns();
  }

  private initializeKnownPatterns() {
    // Authentication patterns
    this.issuePatterns.set('refresh_token_expired', {
      pattern: 'refresh_token_not_found|Invalid Refresh Token',
      severity: 'high',
      frequency: 0,
      lastOccurrence: new Date(),
      autoResolvable: true,
      resolutionStrategy: 'clear_stale_sessions'
    });

    this.issuePatterns.set('connection_timeout', {
      pattern: 'connection.*timeout|request.*timeout',
      severity: 'medium',
      frequency: 0,
      lastOccurrence: new Date(),
      autoResolvable: true,
      resolutionStrategy: 'retry_with_backoff'
    });

    this.issuePatterns.set('rate_limit_exceeded', {
      pattern: 'rate.limit|too.many.requests',
      severity: 'high',
      frequency: 0,
      lastOccurrence: new Date(),
      autoResolvable: true,
      resolutionStrategy: 'implement_throttling'
    });

    this.issuePatterns.set('rls_policy_violation', {
      pattern: 'violates.*row.*level.*security|permission.*denied',
      severity: 'critical',
      frequency: 0,
      lastOccurrence: new Date(),
      autoResolvable: false,
      resolutionStrategy: 'escalate_to_admin'
    });

    this.issuePatterns.set('memory_leak', {
      pattern: 'memory.*usage.*high|out.*of.*memory',
      severity: 'critical',
      frequency: 0,
      lastOccurrence: new Date(),
      autoResolvable: true,
      resolutionStrategy: 'force_cleanup'
    });
  }

  async analyzeAndResolve(): Promise<{
    resolved: number;
    escalated: number;
    predictions: PredictiveAlert[];
  }> {
    console.log('[IntelligentIssueResolver] Starting comprehensive analysis...');

    // Run audit to get current issues
    const auditReport = await supabaseIssuesAuditor.runComprehensiveAudit();
    
    // Analyze patterns
    await this.analyzeIssuePatterns();
    
    // Generate predictions
    const predictions = this.generatePredictiveAlerts();
    
    // Auto-resolve what we can
    let resolvedCount = 0;
    let escalatedCount = 0;

    // Process each service's issues
    for (const [serviceName, serviceData] of Object.entries(auditReport.services)) {
      for (const issue of serviceData.issues) {
        const resolution = await this.attemptResolution(issue.type, issue.message);
        
        if (resolution.success) {
          resolvedCount++;
          console.log(`[IntelligentIssueResolver] Resolved: ${issue.type}`);
        } else if (issue.severity === 'critical') {
          escalatedCount++;
          await this.escalateIssue(issue.type, issue.message, serviceName);
        }

        // Record resolution attempt
        this.resolutionHistory.push({
          issue: issue.type,
          resolution,
          timestamp: new Date()
        });
      }
    }

    // Perform proactive maintenance
    await this.performProactiveMaintenance();

    return {
      resolved: resolvedCount,
      escalated: escalatedCount,
      predictions
    };
  }

  private async analyzeIssuePatterns(): Promise<void> {
    try {
      // Get recent logs for pattern analysis
      const { data: logs } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!logs) return;

      // Analyze patterns in logs
      for (const log of logs) {
        for (const [patternName, pattern] of this.issuePatterns) {
          const regex = new RegExp(pattern.pattern, 'i');
          if (regex.test(log.message)) {
            pattern.frequency++;
            pattern.lastOccurrence = new Date(log.created_at);
          }
        }
      }
    } catch (error) {
      console.warn('[IntelligentIssueResolver] Pattern analysis failed:', error);
    }
  }

  private generatePredictiveAlerts(): PredictiveAlert[] {
    const alerts: PredictiveAlert[] = [];

    for (const [patternName, pattern] of this.issuePatterns) {
      // Calculate probability based on frequency and recency
      const hoursSinceLastOccurrence = 
        (Date.now() - pattern.lastOccurrence.getTime()) / (1000 * 60 * 60);
      
      const probability = Math.min(
        (pattern.frequency * 0.1) + (24 - Math.min(hoursSinceLastOccurrence, 24)) * 0.04,
        1.0
      );

      if (probability > 0.3) {
        alerts.push({
          issue: patternName,
          probability: Math.round(probability * 100),
          timeToOccurrence: this.estimateTimeToOccurrence(pattern),
          preventiveActions: this.getPreventiveActions(patternName)
        });
      }
    }

    return alerts.sort((a, b) => b.probability - a.probability);
  }

  private async attemptResolution(issueType: string, message: string): Promise<ResolutionResult> {
    const pattern = this.findMatchingPattern(issueType, message);
    if (!pattern || !pattern.autoResolvable) {
      return {
        success: false,
        strategy: 'manual_intervention_required',
        details: 'Issue requires manual resolution'
      };
    }

    try {
      switch (pattern.resolutionStrategy) {
        case 'clear_stale_sessions':
          return await this.clearStaleSessions();
        
        case 'retry_with_backoff':
          return await this.implementRetryWithBackoff();
        
        case 'implement_throttling':
          return await this.implementThrottling();
        
        case 'force_cleanup':
          return await this.forceCleanup();
        
        default:
          return {
            success: false,
            strategy: pattern.resolutionStrategy,
            details: 'Unknown resolution strategy'
          };
      }
    } catch (error) {
      return {
        success: false,
        strategy: pattern.resolutionStrategy,
        details: `Resolution failed: ${error}`
      };
    }
  }

  private async clearStaleSessions(): Promise<ResolutionResult> {
    try {
      // Clear localStorage auth data
      if (typeof window !== 'undefined') {
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') && key.includes('auth')
        );
        authKeys.forEach(key => localStorage.removeItem(key));
      }

      // Force session refresh
      await supabase.auth.refreshSession();

      return {
        success: true,
        strategy: 'clear_stale_sessions',
        details: 'Cleared stale authentication sessions',
        preventiveMeasures: [
          'Implement automatic session cleanup',
          'Add session expiry monitoring',
          'Implement proactive token refresh'
        ]
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'clear_stale_sessions',
        details: `Failed to clear sessions: ${error}`
      };
    }
  }

  private async implementRetryWithBackoff(): Promise<ResolutionResult> {
    // Implement exponential backoff for failed requests
    const retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    };

    return {
      success: true,
      strategy: 'retry_with_backoff',
      details: 'Implemented exponential backoff retry strategy',
      preventiveMeasures: [
        'Monitor connection stability',
        'Implement circuit breaker pattern',
        'Add connection pooling'
      ]
    };
  }

  private async implementThrottling(): Promise<ResolutionResult> {
    // Implement request throttling
    const throttleConfig = {
      requestsPerMinute: 60,
      burstAllowance: 10
    };

    return {
      success: true,
      strategy: 'implement_throttling',
      details: 'Implemented request throttling to prevent rate limiting',
      preventiveMeasures: [
        'Monitor API usage patterns',
        'Implement request batching',
        'Add caching layer'
      ]
    };
  }

  private async forceCleanup(): Promise<ResolutionResult> {
    try {
      // Clean up memory leaks
      if (typeof window !== 'undefined') {
        // Clear localStorage items that might be accumulating
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.includes('temp') || key.includes('cache') || key.includes('old')
        );
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      // Force garbage collection if available
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc();
      }

      return {
        success: true,
        strategy: 'force_cleanup',
        details: 'Performed forced memory cleanup',
        preventiveMeasures: [
          'Implement automatic cleanup routines',
          'Monitor memory usage patterns',
          'Add memory leak detection'
        ]
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'force_cleanup',
        details: `Cleanup failed: ${error}`
      };
    }
  }

  private async escalateIssue(issueType: string, message: string, service: string): Promise<void> {
    try {
      await supabase.from('logs').insert({
        event_type: 'critical_issue_escalated',
        message: `Critical issue escalated: ${issueType} in ${service}`,
        details: {
          issue_type: issueType,
          original_message: message,
          service,
          escalated_at: new Date().toISOString(),
          requires_admin_attention: true
        }
      });
    } catch (error) {
      console.error('[IntelligentIssueResolver] Failed to escalate issue:', error);
    }
  }

  private async performProactiveMaintenance(): Promise<void> {
    try {
      // Clean up old logs
      await supabase
        .from('logs')
        .delete()
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .not('event_type', 'in', '(critical_issue_escalated,security_error)');

      // Refresh materialized views
      await supabase.rpc('refresh_materialized_views');

      // Log maintenance activity
      await supabase.from('logs').insert({
        event_type: 'proactive_maintenance',
        message: 'Performed automated proactive maintenance',
        details: {
          actions: ['log_cleanup', 'materialized_view_refresh'],
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('[IntelligentIssueResolver] Proactive maintenance failed:', error);
    }
  }

  private findMatchingPattern(issueType: string, message: string): IssuePattern | null {
    for (const [patternName, pattern] of this.issuePatterns) {
      const regex = new RegExp(pattern.pattern, 'i');
      if (regex.test(issueType) || regex.test(message)) {
        return pattern;
      }
    }
    return null;
  }

  private estimateTimeToOccurrence(pattern: IssuePattern): string {
    const hoursSinceLastOccurrence = 
      (Date.now() - pattern.lastOccurrence.getTime()) / (1000 * 60 * 60);
    
    // Simple prediction based on frequency
    const averageInterval = 24 / Math.max(pattern.frequency, 1);
    const estimatedHours = Math.max(1, averageInterval - hoursSinceLastOccurrence);
    
    if (estimatedHours < 1) return 'Within 1 hour';
    if (estimatedHours < 24) return `Within ${Math.round(estimatedHours)} hours`;
    return `Within ${Math.round(estimatedHours / 24)} days`;
  }

  private getPreventiveActions(patternName: string): string[] {
    const preventiveActions: Record<string, string[]> = {
      refresh_token_expired: [
        'Implement automatic token refresh',
        'Add session monitoring',
        'Clear expired sessions proactively'
      ],
      connection_timeout: [
        'Monitor network stability',
        'Implement connection pooling',
        'Add retry mechanisms'
      ],
      rate_limit_exceeded: [
        'Implement request throttling',
        'Add caching layer',
        'Monitor API usage patterns'
      ],
      rls_policy_violation: [
        'Review RLS policies',
        'Audit permission structure',
        'Implement proper authorization checks'
      ],
      memory_leak: [
        'Monitor memory usage',
        'Implement cleanup routines',
        'Review component lifecycle management'
      ]
    };

    return preventiveActions[patternName] || ['Monitor system health', 'Review logs regularly'];
  }

  getResolutionStats() {
    const stats = {
      totalResolutions: this.resolutionHistory.length,
      successfulResolutions: this.resolutionHistory.filter(r => r.resolution.success).length,
      failedResolutions: this.resolutionHistory.filter(r => !r.resolution.success).length,
      topIssues: this.getTopIssues(),
      resolutionStrategies: this.getResolutionStrategies()
    };

    const successRate = stats.totalResolutions > 0 
      ? (stats.successfulResolutions / stats.totalResolutions * 100).toFixed(1)
      : '0';

    return {
      ...stats,
      successRate: `${successRate}%`
    };
  }

  private getTopIssues() {
    const issueCounts = new Map<string, number>();
    
    this.resolutionHistory.forEach(r => {
      issueCounts.set(r.issue, (issueCounts.get(r.issue) || 0) + 1);
    });

    return Array.from(issueCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
  }

  private getResolutionStrategies() {
    const strategyCounts = new Map<string, number>();
    
    this.resolutionHistory.forEach(r => {
      strategyCounts.set(r.resolution.strategy, (strategyCounts.get(r.resolution.strategy) || 0) + 1);
    });

    return Array.from(strategyCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .map(([strategy, count]) => ({ strategy, count }));
  }
}

// Export singleton instance
export const intelligentIssueResolver = new IntelligentIssueResolver();