
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';

interface DataHealthMonitorProps {
  showInDashboard?: boolean;
}

const DataHealthMonitor: React.FC<DataHealthMonitorProps> = ({ showInDashboard = false }) => {
  const {
    employees,
    assignments,
    cars,
    loading,
    errors,
    fromCache,
    isLoading,
    hasErrors,
    refetchAll,
    resetCircuitBreakers,
    checkSystemHealth,
    serviceStatus
  } = useUnifiedData();

  const [healthData, setHealthData] = useState<any>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const handleHealthCheck = async () => {
    setCheckingHealth(true);
    try {
      const health = await checkSystemHealth();
      setHealthData(health);
    } finally {
      setCheckingHealth(false);
    }
  };

  const getStatusColor = (hasError: boolean, isLoading: boolean, fromCache: boolean) => {
    if (hasError) return 'destructive';
    if (isLoading) return 'secondary';
    if (fromCache) return 'outline';
    return 'default';
  };

  const getStatusIcon = (hasError: boolean, isLoading: boolean) => {
    if (hasError) return <AlertCircle className="h-4 w-4" />;
    if (isLoading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  if (showInDashboard) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <Badge variant={getStatusColor(!!errors.employees, loading.employees, fromCache.employees)} className="w-full justify-center">
                <span className="flex items-center gap-1">
                  {getStatusIcon(!!errors.employees, loading.employees)}
                  Employees ({employees.length})
                </span>
              </Badge>
              {fromCache.employees && <div className="text-xs text-muted-foreground mt-1">Cached</div>}
            </div>
            <div className="text-center">
              <Badge variant={getStatusColor(!!errors.assignments, loading.assignments, fromCache.assignments)} className="w-full justify-center">
                <span className="flex items-center gap-1">
                  {getStatusIcon(!!errors.assignments, loading.assignments)}
                  Tasks ({assignments.length})
                </span>
              </Badge>
              {fromCache.assignments && <div className="text-xs text-muted-foreground mt-1">Cached</div>}
            </div>
            <div className="text-center">
              <Badge variant={getStatusColor(!!errors.cars, loading.cars, fromCache.cars)} className="w-full justify-center">
                <span className="flex items-center gap-1">
                  {getStatusIcon(!!errors.cars, loading.cars)}
                  Cars ({cars.length})
                </span>
              </Badge>
              {fromCache.cars && <div className="text-xs text-muted-foreground mt-1">Cached</div>}
            </div>
          </div>

          {hasErrors && (
            <div className="flex gap-2">
              <Button 
                onClick={refetchAll} 
                size="sm" 
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Retry
              </Button>
              <Button 
                onClick={resetCircuitBreakers} 
                size="sm" 
                variant="outline"
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Health Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {getStatusIcon(!!errors.employees, loading.employees)}
                Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
              <div className="text-sm text-muted-foreground">
                {fromCache.employees && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Cached</span>}
                {errors.employees && <span className="text-red-500">{errors.employees}</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {getStatusIcon(!!errors.assignments, loading.assignments)}
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.length}</div>
              <div className="text-sm text-muted-foreground">
                {fromCache.assignments && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Cached</span>}
                {errors.assignments && <span className="text-red-500">{errors.assignments}</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {getStatusIcon(!!errors.cars, loading.cars)}
                Cars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cars.length}</div>
              <div className="text-sm text-muted-foreground">
                {fromCache.cars && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Cached</span>}
                {errors.cars && <span className="text-red-500">{errors.cars}</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={refetchAll} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh All Data
          </Button>

          <Button 
            onClick={resetCircuitBreakers} 
            variant="outline"
          >
            Reset Circuit Breakers
          </Button>

          <Button 
            onClick={handleHealthCheck} 
            variant="outline"
            disabled={checkingHealth}
          >
            <Database className={`h-4 w-4 mr-2 ${checkingHealth ? 'animate-pulse' : ''}`} />
            System Health Check
          </Button>
        </div>

        {/* Service Status */}
        {serviceStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Service Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div>Cache Entries: {serviceStatus.cacheSize}</div>
                <div>Circuit Breakers: {serviceStatus.circuitBreakers.length}</div>
                {serviceStatus.circuitBreakers.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-muted-foreground">Active Circuit Breakers:</div>
                    {serviceStatus.circuitBreakers.map((cb: any, index: number) => (
                      <Badge key={index} variant="destructive" className="text-xs mr-1">
                        {cb.operation}: {cb.failures} failures
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Check Results */}
        {healthData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">System Health Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default DataHealthMonitor;
