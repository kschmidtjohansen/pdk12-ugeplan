import React from 'react';
import ListSkeleton from '@/components/shared/ListSkeleton';

const RouteLoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <ListSkeleton />
    </div>
  );
};

export default RouteLoadingFallback;
