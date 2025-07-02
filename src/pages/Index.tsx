
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();
  const [forceComplete, setForceComplete] = useState(false);

  console.log('[Index] SIMPLIFIED - Render - isAuthenticated:', isAuthenticated, 'loading:', loading);

  // FIXED: Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('[Index] SIMPLIFIED - Loading timeout reached, forcing navigation');
      setForceComplete(true);
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, []);

  // Show loading state briefly
  if (loading && !forceComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
          <p className="text-xs text-gray-400">If this takes too long, please refresh the page</p>
        </div>
      </div>
    );
  }

  // Simple routing logic - if timeout reached, default to login
  if (forceComplete && !isAuthenticated) {
    console.log('[Index] SIMPLIFIED - Timeout reached, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return isAuthenticated ? 
    <Navigate to="/dashboard" replace /> : 
    <Navigate to="/login" replace />;
};

export default Index;
