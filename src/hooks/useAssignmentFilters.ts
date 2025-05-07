
import { Assignment } from '@/types/assignment';
import { isWithinInterval, parseISO } from 'date-fns';
import { getWeekDates } from '@/utils/dateUtils';

export const useAssignmentFilters = () => {
  // Filter assignments by week
  const filterByWeek = (assignments: Assignment[], weekNumber: number) => {
    const { start, end } = getWeekDates(weekNumber);
    
    return assignments.filter(assignment => {
      const assignmentDate = parseISO(assignment.date);
      return isWithinInterval(assignmentDate, { start, end });
    });
  };

  // Filter assignments by permissions
  const filterByPermissions = (assignments: Assignment[], canSeeUnpublishedTasks: boolean) => {
    return canSeeUnpublishedTasks 
      ? assignments 
      : assignments.filter(assignment => assignment.published === true);
  };

  // Group assignments by date
  const groupByDate = (assignments: Assignment[]) => {
    return assignments.reduce<Record<string, Assignment[]>>((acc, assignment) => {
      const dateKey = assignment.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(assignment);
      return acc;
    }, {});
  };

  return {
    filterByWeek,
    filterByPermissions,
    groupByDate
  };
};
