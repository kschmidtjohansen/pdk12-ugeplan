
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

  const filterUserAssignments = (assignments: Assignment[], userNameOrId: string): Assignment[] => {
    console.log(`[useAssignmentFilters] Filtering assignments for user: "${userNameOrId}"`);
    console.log(`[useAssignmentFilters] Total assignments to filter: ${assignments.length}`);
    
    const filteredAssignments = assignments.filter(assignment => {
      if (!assignment.employees || assignment.employees.length === 0) {
        return false;
      }
      
      // Since assignment.employees is string[] (employee names), we compare with the provided userNameOrId
      // This now works correctly when userNameOrId is the user's name (e.g., "Mark Hansen")
      const isUserInAssignment = assignment.employees.some(emp => emp === userNameOrId);
      
      if (isUserInAssignment) {
        console.log(`[useAssignmentFilters] Found assignment "${assignment.title}" with employees:`, assignment.employees);
      }
      
      return isUserInAssignment;
    });
    
    console.log(`[useAssignmentFilters] Filtered result: ${filteredAssignments.length} assignments for user "${userNameOrId}"`);
    
    return filteredAssignments;
  };

  return {
    filterByPermissions,
    groupByDate,
    filterByWeek,
    filterUserAssignments
  };
};
