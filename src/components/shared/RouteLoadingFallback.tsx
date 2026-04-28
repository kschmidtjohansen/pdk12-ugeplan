import React from 'react';

const RouteLoadingFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-9 w-9 border-2 border-border border-t-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default RouteLoadingFallback;
