
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  console.log('[Index] CRITICAL FIX - Render - isAuthenticated:', isAuthenticated, 'loading:', loading);

  // Prevent redirect loops by ensuring component is mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Wait for mount to prevent hydration issues
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  // Show loading only briefly
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Clear navigation logic
  if (isAuthenticated) {
    console.log('[Index] CRITICAL FIX - User authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('[Index] CRITICAL FIX - User not authenticated, redirecting to login');
  return <Navigate to="/login" replace />;
};

export default Index;
