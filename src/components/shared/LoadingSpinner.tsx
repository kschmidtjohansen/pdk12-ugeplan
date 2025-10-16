
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col justify-center items-center py-8 space-y-4">
      <div className={`rounded-full border-t-2 border-polygon-blue ${sizeClasses[size]}`} style={{ animation: 'spin 1s linear infinite', willChange: 'transform' }}></div>
      {message && (
        <p className="text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
