
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  // Log when the index page is accessed
  useEffect(() => {
    console.log('Index page loaded - redirecting to dashboard');
  }, []);

  // Navigate directly to the dashboard page
  return <Navigate to="/dashboard" replace />;
};

export default Index;
