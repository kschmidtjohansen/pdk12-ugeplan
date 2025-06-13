
interface PerformanceMetric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  
  static recordMetric(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: Date.now()
    } as any);
    
    // Send to database every 10 metrics or every 30 seconds
    if (this.metrics.length >= 10) {
      this.flushMetrics();
    }
  }
  
  static startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_duration`, duration, { unit: 'ms' });
    };
  }
  
  private static async flushMetrics() {
    if (this.metrics.length === 0) return;
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const metricsToSend = this.metrics.splice(0); // Clear and get all metrics
      
      await supabase
        .from('performance_metrics')
        .insert(
          metricsToSend.map(metric => ({
            metric_name: metric.name,
            metric_value: metric.value,
            tags: metric.tags || {}
          }))
        );
        
    } catch (error) {
      console.error('Failed to flush performance metrics:', error);
    }
  }
  
  // Flush metrics periodically
  static {
    setInterval(() => {
      this.flushMetrics();
    }, 30000); // Every 30 seconds
  }
}

// Usage examples:
// PerformanceMonitor.recordMetric('query_count', 1);
// const timer = PerformanceMonitor.startTimer('fetch_assignments');
// timer(); // Stop timer and record
