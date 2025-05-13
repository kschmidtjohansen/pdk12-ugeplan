
import { Assignment } from '@/types/assignment';
import { getWeekDates } from '@/utils/weekDates';

// Filters and groups assignments
export const useAssignmentFilters = () => {
  // Filter assignments based on user permissions
  const filterByPermissions = (assignments: Assignment[], canSeeUnpublishedTasks: boolean) => {
    if (canSeeUnpublishedTasks) {
      // Admin or skadeleder can see all
      return assignments;
    } else {
      // Others can only see published tasks
      return assignments.filter(a => a.published);
    }
  };

  // Group assignments by date
  const groupByDate = (assignments: Assignment[]) => {
    const grouped: Record<string, Assignment[]> = {};
    
    assignments.forEach(assignment => {
      const date = assignment.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(assignment);
    });
    
    return grouped;
  };

  // Filter assignments by ISO week and year
  const filterByWeek = (assignments: Assignment[], weekNumber: number, year: number) => {
    const { start, end } = getWeekDates(weekNumber, year);
    
    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      return assignmentDate >= start && assignmentDate <= end;
    });
  };

  return {
    filterByPermissions,
    groupByDate,
    filterByWeek
  };
};
