
import { addWeeks, subWeeks } from 'date-fns';
import { getWeek, getYear } from 'date-fns';

/**
 * Get the previous week's number and year
 */
export const getPreviousWeekInfo = (currentWeek: number, currentYear: number): { week: number; year: number } => {
  // Create a date for the current week (e.g., Monday of that week)
  const currentDate = new Date(currentYear, 0, 1);
  currentDate.setDate(currentDate.getDate() + (currentWeek - 1) * 7);
  
  // Subtract a week
  const previousDate = subWeeks(currentDate, 1);
  
  // Get week and year
  return {
    week: getWeek(previousDate, { weekStartsOn: 1, firstWeekContainsDate: 4 }),
    year: getYear(previousDate)
  };
};

/**
 * Get the next week's number and year
 */
export const getNextWeekInfo = (currentWeek: number, currentYear: number): { week: number; year: number } => {
  // Create a date for the current week (e.g., Monday of that week)
  const currentDate = new Date(currentYear, 0, 1);
  currentDate.setDate(currentDate.getDate() + (currentWeek - 1) * 7);
  
  // Add a week
  const nextDate = addWeeks(currentDate, 1);
  
  // Get week and year
  return {
    week: getWeek(nextDate, { weekStartsOn: 1, firstWeekContainsDate: 4 }),
    year: getYear(nextDate)
  };
};
