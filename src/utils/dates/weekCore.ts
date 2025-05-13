
import { 
  parseISO, 
  getISOWeek, 
  getISOWeekYear, 
  format,
  startOfISOWeek, 
  endOfISOWeek, 
  setISOWeek, 
  setISOWeekYear,
  getDay
} from "date-fns";
import { da } from "date-fns/locale"; // Import Danish locale

/**
 * Get the date range for a specific ISO week number and year
 * ISO weeks start on Monday and end on Sunday according to ISO 8601
 */
export const getWeekDates = (weekNumber: number, year: number) => {
  if (weekNumber < 1 || weekNumber > 53) {
    throw new Error(`Invalid week number: ${weekNumber}. Must be between 1 and 53.`);
  }
  
  // Create a date in the specified year
  let baseDate = new Date(year, 0, 4); // January 4th is always in week 1
  
  // First set the ISO week year to ensure proper year context
  baseDate = setISOWeekYear(baseDate, year);
  
  // Then set the ISO week - this puts us somewhere in the target week
  baseDate = setISOWeek(baseDate, weekNumber);
  
  // Get the Monday of that week (start of ISO week)
  // startOfISOWeek ALWAYS returns a Monday according to ISO 8601
  const weekStart = startOfISOWeek(baseDate);
  
  // Get the Sunday of that week (end of ISO week)
  // endOfISOWeek ALWAYS returns a Sunday according to ISO 8601
  const weekEnd = endOfISOWeek(baseDate);
  
  // More explicit debugging
  console.log(`FIXED getWeekDates - Raw week start day: ${weekStart.getDay()} (${format(weekStart, 'EEEE')})`);
  console.log(`FIXED getWeekDates - Raw week end day: ${weekEnd.getDay()} (${format(weekEnd, 'EEEE')})`);
  
  // Verify the week starts on Monday and ends on Sunday
  if (weekStart.getDay() !== 1) {
    console.error(`FIXED ERROR: Week start day is not Monday! Got day ${weekStart.getDay()} (${format(weekStart, 'EEEE')})`);
  }
  
  if (weekEnd.getDay() !== 0) {
    console.error(`FIXED ERROR: Week end day is not Sunday! Got day ${weekEnd.getDay()} (${format(weekEnd, 'EEEE')})`);
  }
  
  // More explicit logging of each day in the week
  let currentDay = new Date(weekStart);
  console.log("FIXED getWeekDates - WEEK DAYS CHECK:");
  for (let i = 0; i < 7; i++) {
    console.log(`FIXED: Day ${i+1}: ${format(currentDay, 'yyyy-MM-dd')} - ${format(currentDay, 'EEEE')} (day ${currentDay.getDay()})`);
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  // Add comprehensive debug logging
  console.log(`FIXED: Week ${weekNumber}, ${year} - Start: ${format(weekStart, 'yyyy-MM-dd')} (${format(weekStart, 'EEEE', { locale: da })})`);
  console.log(`FIXED: Week ${weekNumber}, ${year} - End: ${format(weekEnd, 'yyyy-MM-dd')} (${format(weekEnd, 'EEEE', { locale: da })})`);
  
  // If we're debugging week 20, add extra logging
  if (weekNumber === 20 && year === 2025) {
    console.log("FIXED DEBUGGING WEEK 20 OF 2025:");
    for (let i = 0; i <= 6; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      console.log(`  FIXED: Day ${i+1}: ${format(day, 'yyyy-MM-dd')} - ${format(day, 'EEEE d. MMMM', { locale: da })} (day ${day.getDay()})`);
    }
  }
  
  return {
    start: weekStart,
    end: weekEnd,
    weekNumber,
    year
  };
};

/**
 * Get the current ISO week number and year
 */
export const getCurrentWeekInfo = () => {
  const now = new Date();
  return {
    week: getISOWeek(now),
    year: getISOWeekYear(now)
  };
};

/**
 * Get the current week dates
 * Returns the date range for the current week
 */
export const getCurrentWeekDates = () => {
  const now = new Date();
  const currentWeekInfo = getCurrentWeekInfo();
  return getWeekDates(currentWeekInfo.week, currentWeekInfo.year);
};

// These functions are kept for backward compatibility but may be deprecated in future
export const getCurrentWeekNumber = () => getCurrentWeekInfo().week;

export const getWeekNumber = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return getISOWeek(dateObj);
};

export const getYearForDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  // Return ISO week year, not calendar year
  return getISOWeekYear(dateObj);
};
