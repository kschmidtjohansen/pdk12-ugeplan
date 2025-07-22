
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();
  const [forceComplete, setForceComplete] = useState(false);

  console.log('[Index] SIMPLIFIED - Render - isAuthenticated:', isAuthenticated, 'loading:', loading);

  // SIMPLIFIED: Reduce timeout and improve UX
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('[Index] SIMPLIFIED - Loading timeout reached, forcing navigation');
      setForceComplete(true);
    }, 3000); // Reduced to 3 seconds for better UX

    return () => clearTimeout(timeout);
  }, []);

  // Show loading state briefly
  if (loading && !forceComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // SIMPLIFIED: Direct navigation logic
  if (isAuthenticated) {
    console.log('[Index] SIMPLIFIED - User authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  } else {
    console.log('[Index] SIMPLIFIED - User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
};

export default Index;
