
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { isAuthenticated, user, loading } = useAuth();

  // Log when the index page is accessed
  useEffect(() => {
    console.log(`[Index] Page loaded on domain: ${window.location.hostname} - Auth status:`, { 
      isAuthenticated, 
      user: user?.name,
      loading 
    });
  }, [isAuthenticated, user, loading]);

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
          {window.location.hostname.includes('pdk12.dk') && (
            <p className="text-sm text-gray-500">Initializing pdk12.dk connection...</p>
          )}
        </div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard, otherwise redirect to login
  if (isAuthenticated && user) {
    console.log(`[Index] User is authenticated on ${window.location.hostname}, redirecting to dashboard`);
    return <Navigate to="/dashboard" replace />;
  } else {
    console.log(`[Index] User is not authenticated on ${window.location.hostname}, redirecting to login`);
    return <Navigate to="/login" replace />;
  }
};

export default Index;
