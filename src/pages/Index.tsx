
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();
  const [forceComplete, setForceComplete] = useState(false);

  console.log('[Index] FIXED - Render - isAuthenticated:', isAuthenticated, 'loading:', loading);

  // FIXED: Reduce timeout to 10 seconds for better UX
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('[Index] FIXED - Loading timeout reached, forcing navigation');
      setForceComplete(true);
    }, 10000); // Reduced from 15 to 10 seconds

    return () => clearTimeout(timeout);
  }, []);

  // Show loading state briefly with better messaging
  if (loading && !forceComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
          <p className="text-xs text-gray-400">This should only take a moment</p>
        </div>
      </div>
    );
  }

  // FIXED: Better timeout handling with user feedback
  if (forceComplete && !isAuthenticated) {
    console.log('[Index] FIXED - Timeout reached, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return isAuthenticated ? 
    <Navigate to="/dashboard" replace /> : 
    <Navigate to="/login" replace />;
};

export default Index;
