
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Database, Zap, TrendingUp, RefreshCw, Settings } from 'lucide-react';
import { useAssignmentDataPhase3 } from '@/hooks/assignment/useAssignmentDataPhase3';
import { PerformanceMonitor } from '@/utils/performanceOptimizations';
import { enablePhase3, disablePhase3, isPhase3Enabled } from '@/utils/assignmentDataMigration';

const PerformanceMonitoringPanel: React.FC = () => {
  const { getPerformanceStats, forceRefresh, invalidateCache } = useAssignmentDataPhase3();
  const [stats, setStats] = useState<any>({});
  const [phase3Enabled, setPhase3Enabled] = useState(isPhase3Enabled());

  useEffect(() => {
    const updateStats = () => {
      const performanceStats = getPerformanceStats();
      setStats(performanceStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getPerformanceStats]);

  const handleTogglePhase3 = () => {
    if (phase3Enabled) {
      disablePhase3();
    } else {
      enablePhase3();
    }
  };

  const getCacheHealthColor = (hitRate: number) => {
    if (hitRate >= 80) return 'text-green-600';
    if (hitRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getErrorRateColor = (errorRate: number) => {
    if (errorRate <= 5) return 'text-green-600';
    if (errorRate <= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Monitoring</h2>
        <div className="flex gap-2">
          <Button
            variant={phase3Enabled ? "default" : "outline"}
            onClick={handleTogglePhase3}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Phase 3 {phase3Enabled ? 'Enabled' : 'Disabled'}
          </Button>
          <Button onClick={forceRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Force Refresh
          </Button>
          <Button onClick={invalidateCache} variant="outline" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Clear Cache
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cache">Cache Performance</TabsTrigger>
          <TabsTrigger value="network">Network Stats</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getCacheHealthColor(stats.cacheHitRate || 0)}`}>
                  {(stats.cacheHitRate || 0).toFixed(1)}%
                </div>
                <Progress value={stats.cacheHitRate || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getErrorRateColor(stats.errorRate || 0)}`}>
                  {(stats.errorRate || 0).toFixed(1)}%
                </div>
                <Progress value={Math.min(stats.errorRate || 0, 100)} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRequests || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cache hits: {stats.cacheHits || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cacheSize || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cached entries
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Hit Rate</span>
                  <Badge variant={stats.cacheHitRate >= 80 ? "default" : "secondary"}>
                    {(stats.cacheHitRate || 0).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cache Entries</span>
                  <Badge variant="outline">{stats.cacheSize || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Hits</span>
                  <Badge variant="outline">{stats.cacheHits || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status</span>
                  <Badge variant={phase3Enabled ? "default" : "secondary"}>
                    {phase3Enabled ? "Phase 3 Active" : "Phase 2 Active"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Requests</span>
                  <Badge variant="outline">{stats.totalRequests || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Response Time</span>
                  <Badge variant="outline">{(stats.fetchTime || 0).toFixed(0)}ms</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Connection Pooling</span>
                  <Badge variant={phase3Enabled ? "default" : "secondary"}>
                    {phase3Enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Error Rate</span>
                  <Badge variant={stats.errorRate <= 5 ? "default" : "destructive"}>
                    {(stats.errorRate || 0).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Errors</span>
                  <Badge variant="outline">{stats.errors || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Error Recovery</span>
                  <Badge variant={phase3Enabled ? "default" : "secondary"}>
                    {phase3Enabled ? "Enhanced" : "Basic"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitoringPanel;
