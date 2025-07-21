import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  queryTimes: Record<string, number[]>;
  averageQueryTime: number;
  slowQueries: Array<{ query: string; time: number; timestamp: Date }>;
  memoryUsage: number;
  renderTimes: Record<string, number[]>;
  errorRate: number;
  totalOperations: number;
}

interface PerformanceAlert {
  type: 'slow_query' | 'high_memory' | 'error_spike';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    queryTimes: {},
    averageQueryTime: 0,
    slowQueries: [],
    memoryUsage: 0,
    renderTimes: {},
    errorRate: 0,
    totalOperations: 0
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const operationCount = useRef(0);
  const errorCount = useRef(0);

  const trackQuery = useCallback((queryName: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    operationCount.current++;

    setMetrics(prev => {
      const queryTimes = { ...prev.queryTimes };
      if (!queryTimes[queryName]) {
        queryTimes[queryName] = [];
      }
      queryTimes[queryName].push(duration);
      
      // Keep only last 50 measurements per query
      if (queryTimes[queryName].length > 50) {
        queryTimes[queryName] = queryTimes[queryName].slice(-50);
      }

      // Calculate average query time
      const allTimes = Object.values(queryTimes).flat();
      const averageQueryTime = allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;

      // Track slow queries (>2 seconds)
      const slowQueries = [...prev.slowQueries];
      if (duration > 2000) {
        slowQueries.push({
          query: queryName,
          time: duration,
          timestamp: new Date()
        });
        
        // Keep only last 20 slow queries
        if (slowQueries.length > 20) {
          slowQueries.splice(0, slowQueries.length - 20);
        }

        // Create alert for very slow queries
        if (duration > 5000) {
          setAlerts(prevAlerts => [
            ...prevAlerts.slice(-19), // Keep last 19 alerts
            {
              type: 'slow_query',
              message: `Very slow query detected: ${queryName} took ${Math.round(duration)}ms`,
              severity: 'high',
              timestamp: new Date()
            }
          ]);
        }
      }

      return {
        ...prev,
        queryTimes,
        averageQueryTime,
        slowQueries,
        totalOperations: operationCount.current,
        errorRate: (errorCount.current / operationCount.current) * 100
      };
    });

    // Log performance data periodically
    if (operationCount.current % 10 === 0) {
      console.log(`[Performance] Query: ${queryName}, Duration: ${Math.round(duration)}ms, Avg: ${Math.round(duration)}ms`);
    }
  }, []);

  const trackError = useCallback((errorType: string, error: any) => {
    errorCount.current++;
    
    setMetrics(prev => ({
      ...prev,
      errorRate: (errorCount.current / Math.max(operationCount.current, 1)) * 100
    }));

    // Create alert for high error rates
    const currentErrorRate = (errorCount.current / Math.max(operationCount.current, 1)) * 100;
    if (currentErrorRate > 5) {
      setAlerts(prevAlerts => [
        ...prevAlerts.slice(-19),
        {
          type: 'error_spike',
          message: `High error rate detected: ${Math.round(currentErrorRate)}%`,
          severity: 'high',
          timestamp: new Date()
        }
      ]);
    }

    console.warn(`[Performance] Error tracked: ${errorType}`, error);
  }, []);

  const trackRender = useCallback((componentName: string, renderTime: number) => {
    setMetrics(prev => {
      const renderTimes = { ...prev.renderTimes };
      if (!renderTimes[componentName]) {
        renderTimes[componentName] = [];
      }
      renderTimes[componentName].push(renderTime);
      
      // Keep only last 20 render times per component
      if (renderTimes[componentName].length > 20) {
        renderTimes[componentName] = renderTimes[componentName].slice(-20);
      }

      return { ...prev, renderTimes };
    });
  }, []);

  // Monitor memory usage
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit * 100;
        
        setMetrics(prev => ({ ...prev, memoryUsage }));

        // Alert on high memory usage
        if (memoryUsage > 80) {
          setAlerts(prevAlerts => [
            ...prevAlerts.slice(-19),
            {
              type: 'high_memory',
              message: `High memory usage: ${Math.round(memoryUsage)}%`,
              severity: 'medium',
              timestamp: new Date()
            }
          ]);
        }
      }
    };

    const interval = setInterval(updateMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSlowComponents = useCallback(() => {
    return Object.entries(metrics.renderTimes)
      .map(([component, times]) => ({
        component,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
        maxTime: Math.max(...times)
      }))
      .filter(item => item.averageTime > 100)
      .sort((a, b) => b.averageTime - a.averageTime);
  }, [metrics.renderTimes]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    metrics,
    alerts,
    trackQuery,
    trackError,
    trackRender,
    getSlowComponents,
    clearAlerts
  };
};
