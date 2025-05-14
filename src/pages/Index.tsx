
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  // Log when the index page is accessed
  useEffect(() => {
    console.log('Index page loaded - redirecting to planner');
  }, []);

  // Navigate directly to the planner page instead of dashboard
  return <Navigate to="/planner" replace />;
};

export default Index;
