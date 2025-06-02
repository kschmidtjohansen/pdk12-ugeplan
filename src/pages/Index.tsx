
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { isAuthenticated, user } = useAuth();

  // Log when the index page is accessed
  useEffect(() => {
    console.log('Index page loaded - checking authentication status:', { isAuthenticated, user: user?.name });
  }, [isAuthenticated, user]);

  // If authenticated, redirect to dashboard, otherwise redirect to login
  if (isAuthenticated && user) {
    console.log('User is authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  } else {
    console.log('User is not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
};

export default Index;
