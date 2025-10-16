import React from 'react';

const RouteLoadingFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default RouteLoadingFallback;
