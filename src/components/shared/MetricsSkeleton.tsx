import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricsSkeletonProps {
  count?: number;
}

const MetricsSkeleton: React.FC<MetricsSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
};

export default MetricsSkeleton;
