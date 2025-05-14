
import { 
  parseISO, 
  getISOWeek, 
  getISOWeekYear, 
  format,
  startOfISOWeek, 
  endOfISOWeek, 
  setISOWeek, 
  setISOWeekYear,
  addDays
} from "date-fns";

/**
 * Get the date range for a specific ISO week number and year
 * ISO weeks start on Monday and end on Sunday according to ISO 8601
 */
export const getWeekDates = (weekNumber: number, year: number) => {
  if (weekNumber < 1 || weekNumber > 53) {
    throw new Error(`Invalid week number: ${weekNumber}. Must be between 1 and 53.`);
  }
  
  try {
    // Create a date in the specified year
    const baseDate = new Date(year, 0, 4); // January 4th is always in week 1
    
    // Set the ISO week year first to ensure proper year context
    const dateWithYear = setISOWeekYear(baseDate, year);
    
    // Then set the ISO week number
    const dateWithWeek = setISOWeek(dateWithYear, weekNumber);
    
    // Get the start (Monday) of that ISO week
    const start = startOfISOWeek(dateWithWeek);
    
    // Get the end (Sunday) of that ISO week
    // Using endOfISOWeek directly returns the last millisecond of Sunday
    const end = endOfISOWeek(dateWithWeek);
    
    // Debug output
    console.log(`Week ${weekNumber}/${year} - Start: ${format(start, 'yyyy-MM-dd')} (${format(start, 'EEEE')}) - Day: ${start.getDay()}`);
    console.log(`Week ${weekNumber}/${year} - End: ${format(end, 'yyyy-MM-dd')} (${format(end, 'EEEE')}) - Day: ${end.getDay()}`);
    
    // Verify week boundaries - Monday(1) to Sunday(0)
    if (start.getDay() !== 1) {
      console.error(`ERROR: Week start is not Monday! Got day ${start.getDay()} (${format(start, 'EEEE')})`);
    }
    
    if (end.getDay() !== 0) {
      console.error(`ERROR: Week end is not Sunday! Got day ${end.getDay()} (${format(end, 'EEEE')})`);
    }
    
    return {
      start,
      end,
      weekNumber,
      year
    };
  } catch (err) {
    console.error("Error in getWeekDates:", err);
    throw err;
  }
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
