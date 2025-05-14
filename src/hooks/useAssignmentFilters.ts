
import { Assignment } from '@/types/assignment';
import { getWeekDates } from '@/utils/dates';
import { format } from 'date-fns';

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
    try {
      console.log(`Filtering assignments for week ${weekNumber}/${year}`);
      
      // Get the correct date range for the ISO week (Monday to Sunday)
      const { start, end } = getWeekDates(weekNumber, year);
      
      // Set start time to beginning of day and end time to end of day
      const weekStart = new Date(start);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(end);
      weekEnd.setHours(23, 59, 59, 999);
      
      console.log(`Week boundaries for filtering - Start: ${format(weekStart, 'yyyy-MM-dd')} (${format(weekStart, 'EEEE')}, day ${weekStart.getDay()})`);
      console.log(`Week boundaries for filtering - End: ${format(weekEnd, 'yyyy-MM-dd')} (${format(weekEnd, 'EEEE')}, day ${weekEnd.getDay()})`);
      
      return assignments.filter(assignment => {
        // Create a date object from the assignment date string
        const assignmentDate = new Date(assignment.date);
        // Normalize time to noon to avoid timezone issues
        assignmentDate.setHours(12, 0, 0, 0);
        
        // Compare if assignment date falls within week range
        const isInWeek = assignmentDate >= weekStart && assignmentDate <= weekEnd;
        
        if (isInWeek) {
          console.log(`Assignment ${assignment.id} (${assignment.date}) is in week ${weekNumber}`);
        }
        
        return isInWeek;
      });
    } catch (error) {
      console.error("Error filtering by week:", error);
      return [];
    }
  };

  return {
    filterByPermissions,
    groupByDate,
    filterByWeek
  };
};
