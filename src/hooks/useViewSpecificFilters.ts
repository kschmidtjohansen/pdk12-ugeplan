
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';

export const useViewSpecificFilters = () => {
  const { user } = useAuth();

  // Filter for dashboard - servicemedarbejdere only see their own assignments
  const filterForDashboard = (assignments: Assignment[], showUnpublished: boolean = false) => {
    return assignments.filter(assignment => {
      // Administrators and skadeledere can see all assignments
      if (user?.role === 'administrator' || user?.role === 'skadeleder') {
        return showUnpublished || assignment.published;
      }
      
      // Servicemedarbejdere can only see published assignments assigned to them
      if (user?.role === 'servicemedarbejder') {
        return assignment.published === true && 
               assignment.employees && 
               assignment.employees.some(employeeName => employeeName === user?.name);
      }
      
      return false;
    });
  };

  // Filter for planner - servicemedarbejdere can see all published assignments
  const filterForPlanner = (assignments: Assignment[], showUnpublished: boolean = true) => {
    return assignments.filter(assignment => {
      // Administrators and skadeledere can see all assignments
      if (user?.role === 'administrator' || user?.role === 'skadeleder') {
        return showUnpublished || assignment.published;
      }
      
      // Servicemedarbejdere can see ALL published assignments (not just their own)
      if (user?.role === 'servicemedarbejder') {
        return assignment.published === true;
      }
      
      return false;
    });
  };

  return {
    filterForDashboard,
    filterForPlanner
  };
};
