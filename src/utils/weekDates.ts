
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, addWeeks } from "date-fns";

// Generate the first and last day of a given week (ISO week, Monday-Sunday)
export const getWeekDates = (weekOffset = 0) => {
  // Get the current date
  const today = new Date();
  
  // Get the start of the current ISO week (Monday)
  const currentWeekStart = startOfISOWeek(today);
  
  // Get the end of the current ISO week (Sunday)
  const currentWeekEnd = endOfISOWeek(today);
  
  // Calculate the requested week based on offset
  const firstDayOfWeek = addWeeks(currentWeekStart, weekOffset);
  const lastDayOfWeek = addWeeks(currentWeekEnd, weekOffset);
  
  return {
    start: firstDayOfWeek,
    end: lastDayOfWeek
  };
};

// Calculate the current week number based on ISO standard (weeks start on Monday)
export const getCurrentWeekNumber = () => {
  const now = new Date();
  return getISOWeek(now);
};
