
import { getISOWeek } from "date-fns";

// Generate the first and last day of a given week (ISO week, Monday-Sunday)
export const getWeekDates = (weekOffset = 0) => {
  // Get the current date
  const today = new Date();
  
  // Find the Monday (start) of the current week (ISO week starts on Monday)
  const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const diff = currentDay === 0 ? 6 : currentDay - 1; // Adjust for Monday as first day
  
  // Calculate current week's Monday
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - diff);
  currentWeekStart.setHours(0, 0, 0, 0);
  
  // Calculate current week's Sunday
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);
  
  // Calculate the requested week based on offset
  const firstDayOfWeek = new Date(currentWeekStart);
  firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (weekOffset * 7));
  
  const lastDayOfWeek = new Date(currentWeekEnd);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + (weekOffset * 7));
  
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
