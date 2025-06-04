
import { Assignment } from '@/types/assignment';
import { AssignmentFilterService } from '@/services/assignmentFilterService';

export const useAssignmentFilters = () => {
  const filterByPermissions = (assignments: Assignment[], canSeeUnpublished: boolean): Assignment[] => {
    if (canSeeUnpublished) {
      return assignments;
    }
    return assignments.filter(a => a.published);
  };

  const groupByDate = (assignments: Assignment[]): Record<string, Assignment[]> => {
    return AssignmentFilterService.groupByDate(assignments);
  };

  const filterByWeek = (assignments: Assignment[], weekNumber: number, year: number): Assignment[] => {
    return AssignmentFilterService.filterByWeek(assignments, weekNumber, year);
  };

  return {
    filterByPermissions,
    groupByDate,
    filterByWeek
  };
};
