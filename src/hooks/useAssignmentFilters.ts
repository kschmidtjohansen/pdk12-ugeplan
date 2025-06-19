
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

  const filterUserAssignments = (assignments: Assignment[], userId: string): Assignment[] => {
    return assignments.filter(assignment => 
      assignment.employees && assignment.employees.some(emp => 
        typeof emp === 'string' ? emp === userId : emp.id === userId
      )
    );
  };

  return {
    filterByPermissions,
    groupByDate,
    filterByWeek,
    filterUserAssignments
  };
};
