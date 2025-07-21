
import { Assignment } from '@/types/assignment';
import { AssignmentFilterService } from '@/services/assignmentFilterService';
import { useAuth } from '@/context/AuthContext';

export const useViewSpecificFilters = () => {
  const { user } = useAuth();

  const filterForDashboard = (assignments: Assignment[]): Assignment[] => {
    return AssignmentFilterService.filterForDashboard(assignments, {
      userRole: user?.role,
      userName: user?.name
    });
  };

  const filterForPlanner = (assignments: Assignment[]): Assignment[] => {
    return AssignmentFilterService.filterForPlanner(assignments, {
      userRole: user?.role,
      includeUnpublished: user?.role !== 'servicemedarbejder'
    });
  };

  const filterForScreenDisplay = (assignments: Assignment[]): Assignment[] => {
    return assignments.filter(a => a.published);
  };

  return {
    filterForDashboard,
    filterForPlanner,
    filterForScreenDisplay
  };
};
