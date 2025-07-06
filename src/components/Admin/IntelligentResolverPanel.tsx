/**
 * Phase 4: Intelligent Resolver Admin Panel
 * Advanced monitoring and automation dashboard
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Activity,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { useIntelligentResolver } from '@/hooks/useIntelligentResolver';
import { useAuth } from '@/context/AuthContext';

export const IntelligentResolverPanel: React.FC = () => {
  const { user } = useAuth();
  const {
    isAnalyzing,
    lastAnalysis,
    resolvedIssues,
    escalatedIssues,
    predictions,
    resolutionStats,
    autoResolveEnabled,
    runIntelligentAnalysis,
    toggleAutoResolve,
    resetStats,
    hasHighPriorityPredictions,
    systemHealthScore,
    getPredictionSeverity,
    isSystemHealthy,
    needsAttention
  } = useIntelligentResolver();

  // Only show to admin users
  if (!user || user.role !== 'administrator') {
    return null;
  }

  const getHealthScoreColor = () => {
    if (systemHealthScore >= 90) return 'text-green-600';
    if (systemHealthScore >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreVariant = () => {
    if (systemHealthScore >= 90) return 'default';
    if (systemHealthScore >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Intelligent Issue Resolver
          </h2>
          <p className="text-muted-foreground">
            AI-powered predictive analysis and automated issue resolution
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runIntelligentAnalysis} 
            disabled={isAnalyzing}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
          
          <Button 
            onClick={toggleAutoResolve} 
            variant={autoResolveEnabled ? 'default' : 'outline'}
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            {autoResolveEnabled ? 'Auto-Resolve: ON' : 'Auto-Resolve: OFF'}
          </Button>
        </div>
      </div>

      {/* System Health Score */}
      <Card className={`${needsAttention ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health Score
            </span>
            <Badge variant={getHealthScoreVariant()} className="text-lg px-3 py-1">
              {systemHealthScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={systemHealthScore} className="mb-4" />
          <div className="flex justify-between text-sm">
            <span className={isSystemHealthy ? 'text-green-600' : 'text-red-600'}>
              {isSystemHealthy ? '✅ System Healthy' : '⚠️ Attention Required'}
            </span>
            <span className="text-muted-foreground">
              Last Analysis: {lastAnalysis?.toLocaleTimeString() || 'Never'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedIssues}</div>
            <p className="text-xs text-muted-foreground">
              Automatically fixed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{escalatedIssues}</div>
            <p className="text-xs text-muted-foreground">
              Require admin attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictions</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{predictions.length}</div>
            <p className="text-xs text-muted-foreground">
              Issues predicted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {resolutionStats.successRate}
            </div>
            <p className="text-xs text-muted-foreground">
              Resolution success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* High Priority Predictions Alert */}
      {hasHighPriorityPredictions && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>High Priority Predictions Detected!</strong> 
            {' '}The system has identified potential issues with high probability of occurrence. 
            Review the predictions below and consider taking preventive action.
          </AlertDescription>
        </Alert>
      )}

      {/* Predictive Analysis */}
      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Predictive Analysis
            </CardTitle>
            <CardDescription>
              AI-powered predictions of potential issues based on historical patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.slice(0, 5).map((prediction, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">
                        {prediction.issue.replace(/_/g, ' ')}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          getPredictionSeverity(prediction.probability) === 'critical' ? 'destructive' :
                          getPredictionSeverity(prediction.probability) === 'high' ? 'secondary' : 'outline'
                        }>
                          {prediction.probability}% probability
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {prediction.timeToOccurrence}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>Preventive Actions:</strong>
                    </div>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {prediction.preventiveActions.map((action, actionIndex) => (
                        <li key={actionIndex}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolution Statistics */}
      {resolutionStats.totalResolutions > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Most Common Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resolutionStats.topIssues.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm capitalize">
                      {item.issue.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resolution Strategies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Resolution Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resolutionStats.resolutionStrategies.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm capitalize">
                      {item.strategy.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Control Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Controls</CardTitle>
          <CardDescription>
            Manage intelligent resolution settings and maintenance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetStats}>
              Reset Statistics
            </Button>
            <Button variant="outline" disabled>
              Export Report
            </Button>
            <Button variant="outline" disabled>
              Schedule Maintenance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};