
import { getISOWeek, getISOWeekYear, addWeeks, parseISO, getYear } from "date-fns";
import { startOfISOWeek, endOfISOWeek } from "date-fns";

// Generate the first and last day of a given week (ISO week, Monday-Sunday)
export const getWeekDates = (weekOffset = 0) => {
  // Get the current date
  const today = new Date();
  
  // Get the start of the current ISO week (Monday)
  const currentWeekStart = startOfISOWeek(today);
  
  // Get the end of the current ISO week (Sunday)
  const currentWeekEnd = endOfISOWeek(today);
  
  // Calculate the requested week based on offset
  const targetWeekStart = addWeeks(currentWeekStart, weekOffset);
  const targetWeekEnd = addWeeks(currentWeekEnd, weekOffset);
  
  return {
    start: targetWeekStart,
    end: targetWeekEnd
  };
};

// Calculate the current week number based on ISO standard (weeks start on Monday)
export const getCurrentWeekNumber = () => {
  const now = new Date();
  return getISOWeek(now);
};

// Get week number for a specific date
export const getWeekNumber = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return getISOWeek(dateObj);
};

// Get year for a specific date
export const getYearForDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return getYear(dateObj);
};
