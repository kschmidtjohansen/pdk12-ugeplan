/**
 * Phase 4: Hook for Intelligent Issue Resolution
 * Provides intelligent automation and predictive capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import { intelligentIssueResolver } from '@/services/intelligentIssueResolver';
import { useToast } from '@/components/ui/use-toast';

interface ResolverState {
  isAnalyzing: boolean;
  lastAnalysis: Date | null;
  resolvedIssues: number;
  escalatedIssues: number;
  predictions: Array<{
    issue: string;
    probability: number;
    timeToOccurrence: string;
    preventiveActions: string[];
  }>;
  resolutionStats: {
    totalResolutions: number;
    successfulResolutions: number;
    failedResolutions: number;
    successRate: string;
    topIssues: Array<{ issue: string; count: number }>;
    resolutionStrategies: Array<{ strategy: string; count: number }>;
  };
  autoResolveEnabled: boolean;
}

export const useIntelligentResolver = () => {
  const [state, setState] = useState<ResolverState>({
    isAnalyzing: false,
    lastAnalysis: null,
    resolvedIssues: 0,
    escalatedIssues: 0,
    predictions: [],
    resolutionStats: {
      totalResolutions: 0,
      successfulResolutions: 0,
      failedResolutions: 0,
      successRate: '0%',
      topIssues: [],
      resolutionStrategies: []
    },
    autoResolveEnabled: true
  });

  const { toast } = useToast();

  const runIntelligentAnalysis = useCallback(async () => {
    if (state.isAnalyzing) {
      console.log('[useIntelligentResolver] Analysis already in progress');
      return;
    }

    console.log('[useIntelligentResolver] Starting intelligent analysis...');
    
    setState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      const result = await intelligentIssueResolver.analyzeAndResolve();
      const stats = intelligentIssueResolver.getResolutionStats();
      
      console.log('[useIntelligentResolver] Analysis completed:', {
        resolved: result.resolved,
        escalated: result.escalated,
        predictions: result.predictions.length
      });

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        lastAnalysis: new Date(),
        resolvedIssues: result.resolved,
        escalatedIssues: result.escalated,
        predictions: result.predictions,
        resolutionStats: stats
      }));

      // Show appropriate toast notifications
      if (result.resolved > 0) {
        toast({
          title: '🤖 Intelligent Resolution Complete',
          description: `Automatically resolved ${result.resolved} issues`,
          variant: 'default'
        });
      }

      if (result.escalated > 0) {
        toast({
          title: '⚠️ Issues Escalated',
          description: `${result.escalated} critical issues require admin attention`,
          variant: 'destructive'
        });
      }

      if (result.predictions.length > 0) {
        const highProbPredictions = result.predictions.filter(p => p.probability > 70);
        if (highProbPredictions.length > 0) {
          toast({
            title: '🔮 Predictive Alert',
            description: `${highProbPredictions.length} issues predicted with high probability`,
            variant: 'default'
          });
        }
      }

      return result;

    } catch (error) {
      console.error('[useIntelligentResolver] Analysis failed:', error);
      
      setState(prev => ({ ...prev, isAnalyzing: false }));
      
      toast({
        title: 'Analysis Failed',
        description: 'Unable to complete intelligent analysis. Check console for details.',
        variant: 'destructive'
      });
      
      throw error;
    }
  }, [state.isAnalyzing, toast]);

  const toggleAutoResolve = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      autoResolveEnabled: !prev.autoResolveEnabled 
    }));

    toast({
      title: state.autoResolveEnabled ? 'Auto-Resolve Disabled' : 'Auto-Resolve Enabled',
      description: state.autoResolveEnabled 
        ? 'Issues will no longer be automatically resolved'
        : 'System will automatically resolve detected issues',
      variant: 'default'
    });
  }, [state.autoResolveEnabled, toast]);

  const resetStats = useCallback(() => {
    setState(prev => ({
      ...prev,
      resolvedIssues: 0,
      escalatedIssues: 0,
      predictions: [],
      lastAnalysis: null,
      resolutionStats: {
        totalResolutions: 0,
        successfulResolutions: 0,
        failedResolutions: 0,
        successRate: '0%',
        topIssues: [],
        resolutionStrategies: []
      }
    }));

    toast({
      title: 'Stats Reset',
      description: 'Resolution statistics have been cleared',
      variant: 'default'
    });
  }, [toast]);

  // Automatic periodic analysis (every 20 minutes)
  useEffect(() => {
    if (!state.autoResolveEnabled) return;

    const interval = setInterval(() => {
      if (!state.isAnalyzing) {
        console.log('[useIntelligentResolver] Running scheduled intelligent analysis...');
        runIntelligentAnalysis().catch(error => {
          console.warn('[useIntelligentResolver] Scheduled analysis failed:', error);
        });
      }
    }, 20 * 60 * 1000); // 20 minutes

    return () => clearInterval(interval);
  }, [state.autoResolveEnabled, state.isAnalyzing, runIntelligentAnalysis]);

  // Calculate derived values
  const getPredictionSeverity = useCallback((probability: number) => {
    if (probability >= 80) return 'critical';
    if (probability >= 60) return 'high';
    if (probability >= 40) return 'medium';
    return 'low';
  }, []);

  const getSystemHealthScore = useCallback(() => {
    const baseScore = 100;
    const criticalPenalty = state.escalatedIssues * 15;
    const predictionPenalty = state.predictions
      .filter(p => p.probability > 70)
      .length * 5;
    
    return Math.max(0, baseScore - criticalPenalty - predictionPenalty);
  }, [state.escalatedIssues, state.predictions]);

  return {
    // State
    isAnalyzing: state.isAnalyzing,
    lastAnalysis: state.lastAnalysis,
    resolvedIssues: state.resolvedIssues,
    escalatedIssues: state.escalatedIssues,
    predictions: state.predictions,
    resolutionStats: state.resolutionStats,
    autoResolveEnabled: state.autoResolveEnabled,
    
    // Actions
    runIntelligentAnalysis,
    toggleAutoResolve,
    resetStats,
    
    // Computed values
    hasHighPriorityPredictions: state.predictions.some(p => p.probability > 70),
    systemHealthScore: getSystemHealthScore(),
    getPredictionSeverity,
    
    // Summary
    isSystemHealthy: getSystemHealthScore() >= 85 && state.escalatedIssues === 0,
    needsAttention: state.escalatedIssues > 0 || state.predictions.some(p => p.probability > 80)
  };
};