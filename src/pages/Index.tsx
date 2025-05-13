
import { Navigate } from 'react-router-dom';

const Index = () => {
  // Navigate directly to the planner page instead of dashboard
  return <Navigate to="/planner" replace />;
};

export default Index;
