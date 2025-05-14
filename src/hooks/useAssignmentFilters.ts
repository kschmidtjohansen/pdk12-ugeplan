
import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { Assignment } from '@/types/assignment';
import { isDateInWeek } from '@/utils/dates';

export const useAssignmentFilters = () => {
  /**
   * Filter assignments by week number
   */
  const filterByWeek = (assignments: Assignment[], weekNumber: number, year: number) => {
    return assignments.filter(assignment => {
      // Make sure assignment.date is a valid date string
      if (!assignment.date) return false;
      
      const assignmentDate = new Date(assignment.date);
      return isDateInWeek(assignmentDate, weekNumber, year);
    });
  };
  
  /**
   * Filter assignments by specific date
   */
  const filterByDate = (assignments: Assignment[], date: Date | string) => {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    
    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      return isSameDay(assignmentDate, targetDate);
    });
  };
  
  /**
   * Group assignments by date
   */
  const groupByDate = (assignments: Assignment[]) => {
    return assignments.reduce<Record<string, Assignment[]>>((acc, assignment) => {
      // Format the date as YYYY-MM-DD for consistent grouping
      const dateKey = format(new Date(assignment.date), 'yyyy-MM-dd');
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      acc[dateKey].push(assignment);
      return acc;
    }, {});
  };
  
  /**
   * Sort assignments by time
   */
  const sortByTime = (assignments: Assignment[]) => {
    return [...assignments].sort((a, b) => {
      // First compare by date
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // If dates are the same, compare by fromTime
      const fromTimeA = a.fromTime || '00:00';
      const fromTimeB = b.fromTime || '00:00';
      
      return fromTimeA.localeCompare(fromTimeB);
    });
  };
  
  return {
    filterByWeek,
    filterByDate,
    groupByDate,
    sortByTime
  };
};
