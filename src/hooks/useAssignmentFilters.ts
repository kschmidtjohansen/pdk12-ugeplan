
import { Assignment } from '@/types/assignment';
import { AssignmentFilterService } from '@/services/assignmentFilterService';

export const useAssignmentFilters = () => {
  // FIXED: CRITICAL FIX - Updated to work with all users, especially servicemedarbejder
  const filterByPermissions = (assignments: Assignment[], canSeeUnpublished: boolean): Assignment[] => {
    console.log('[useAssignmentFilters] CRITICAL FIX - Filtering assignments by permissions');
    console.log(`[useAssignmentFilters] Input: ${assignments.length} assignments, canSeeUnpublished: ${canSeeUnpublished}`);
    
    if (canSeeUnpublished) {
      console.log('[useAssignmentFilters] User can see unpublished, returning all assignments');
      return assignments;
    }
    
    // FIXED: For planner context, show ALL published assignments regardless of user
    const filtered = assignments.filter(a => a.published);
    console.log(`[useAssignmentFilters] CRITICAL FIX - Filtered to ${filtered.length} published assignments (showing ALL, not user-specific)`);
    return filtered;
  };

  const groupByDate = (assignments: Assignment[]): Record<string, Assignment[]> => {
    console.log(`[useAssignmentFilters] Grouping ${assignments.length} assignments by date`);
    const grouped = AssignmentFilterService.groupByDate(assignments);
    console.log(`[useAssignmentFilters] Grouped into ${Object.keys(grouped).length} date groups`);
    return grouped;
  };

  const filterByWeek = (assignments: Assignment[], weekNumber: number, year: number): Assignment[] => {
    console.log(`[useAssignmentFilters] CRITICAL FIX - Filtering ${assignments.length} assignments for week ${weekNumber} of ${year}`);
    const filtered = AssignmentFilterService.filterByWeek(assignments, weekNumber, year);
    console.log(`[useAssignmentFilters] CRITICAL FIX - Filtered to ${filtered.length} assignments for the week (ALL assignments, not user-filtered)`);
    
    // Log detailed assignment info for debugging
    filtered.forEach(assignment => {
      console.log(`[useAssignmentFilters] Week assignment: ${assignment.id} - ${assignment.title} - Employees: [${assignment.employees?.join(', ')}] - Published: ${assignment.published}`);
    });
    
    return filtered;
  };

  return {
    filterByPermissions,
    groupByDate,
    filterByWeek
  };
};
