
import { Assignment } from '@/types/assignment';
import { AssignmentFilterService } from '@/services/assignmentFilterService';

export const useAssignmentFilters = () => {
  // CRITICAL FIX: Filter assignments by permissions - planner shows ALL, dashboard shows user assignments
  const filterByPermissions = (assignments: Assignment[], canSeeUnpublished: boolean): Assignment[] => {
    console.log('[useAssignmentFilters] CRITICAL FIX - Filtering assignments by permissions');
    console.log(`[useAssignmentFilters] Input: ${assignments.length} assignments, canSeeUnpublished: ${canSeeUnpublished}`);
    
    if (canSeeUnpublished) {
      console.log('[useAssignmentFilters] CRITICAL FIX - User can see unpublished, returning ALL assignments');
      return assignments;
    }
    
    // For published assignments only
    const filtered = assignments.filter(a => a.published);
    console.log(`[useAssignmentFilters] CRITICAL FIX - Filtered to ${filtered.length} published assignments`);
    return filtered;
  };

  const groupByDate = (assignments: Assignment[]): Record<string, Assignment[]> => {
    console.log(`[useAssignmentFilters] CRITICAL FIX - Grouping ${assignments.length} assignments by date`);
    const grouped = AssignmentFilterService.groupByDate(assignments);
    console.log(`[useAssignmentFilters] CRITICAL FIX - Grouped into ${Object.keys(grouped).length} date groups`);
    return grouped;
  };

  const filterByWeek = (assignments: Assignment[], weekNumber: number, year: number): Assignment[] => {
    console.log(`[useAssignmentFilters] CRITICAL FIX - Filtering ${assignments.length} assignments for week ${weekNumber} of ${year}`);
    const filtered = AssignmentFilterService.filterByWeek(assignments, weekNumber, year);
    console.log(`[useAssignmentFilters] CRITICAL FIX - Filtered to ${filtered.length} assignments for the week`);
    
    // Log detailed assignment info for debugging
    filtered.forEach(assignment => {
      console.log(`[useAssignmentFilters] CRITICAL FIX - Week assignment: ${assignment.id} - ${assignment.title} - Employees: [${assignment.employees?.join(', ')}] - Published: ${assignment.published}`);
    });
    
    return filtered;
  };

  return {
    filterByPermissions,
    groupByDate,
    filterByWeek
  };
};
