
import { parseISO, getISOWeek, getISOWeekYear, getYear } from "date-fns";
import { 
  format,
  startOfISOWeek, 
  endOfISOWeek, 
  setISOWeek, 
  setISOWeekYear
} from "date-fns";
import { da } from "date-fns/locale"; // Import Danish locale from the correct path

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
  
  // Then set the ISO week
  baseDate = setISOWeek(baseDate, weekNumber);
  
  // Get the Monday of that week (start of ISO week)
  const weekStart = startOfISOWeek(baseDate);
  
  // Get the Sunday of that week (end of ISO week)
  const weekEnd = endOfISOWeek(baseDate);
  
  // Add debug logging for troubleshooting
  console.log(`Week ${weekNumber}, ${year} - Start: ${format(weekStart, 'yyyy-MM-dd')} (${format(weekStart, 'EEEE')})`);
  console.log(`Week ${weekNumber}, ${year} - End: ${format(weekEnd, 'yyyy-MM-dd')} (${format(weekEnd, 'EEEE')})`);
  
  return {
    start: weekStart,
    end: weekEnd,
    weekNumber,
    year
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
 * Get the previous ISO week number and year
 * Takes into account year boundaries
 */
export const getPreviousWeekInfo = (weekNumber: number, year: number) => {
  if (weekNumber > 1) {
    return {
      week: weekNumber - 1,
      year
    };
  } else {
    // If at week 1, go to last week of previous year
    const prevYearDate = new Date(year - 1, 11, 31); // Dec 31 of previous year
    
    return {
      week: getISOWeek(prevYearDate),
      year: year - 1
    };
  }
};

/**
 * Get the next ISO week number and year
 * Takes into account year boundaries
 */
export const getNextWeekInfo = (weekNumber: number, year: number) => {
  // Get the last week number of the current year
  const lastDate = new Date(year, 11, 31); // December 31st
  const lastWeekOfYear = getISOWeek(lastDate);
  
  if (weekNumber < lastWeekOfYear) {
    return {
      week: weekNumber + 1,
      year
    };
  } else {
    // If at the last week, go to first week of next year
    return {
      week: 1,
      year: year + 1
    };
  }
};

/**
 * Format a week date range as a string
 * Example: "Mandag 6. - Søndag 12. maj" (Danish)
 * or "Monday, May 6 - Sunday, May 12" (English)
 */
export const formatWeekDateRange = (weekDates: { start: Date; end: Date }, locale: string = 'en') => {
  try {
    if (locale === 'da') {
      // Include weekday names for Danish format
      return `${format(weekDates.start, 'EEEE d.', { locale: da })} - ${format(weekDates.end, 'EEEE d. MMMM', { locale: da })}`;
    } else {
      // Include weekday names for English format
      return `${format(weekDates.start, 'EEEE, MMMM d')} - ${format(weekDates.end, 'EEEE, MMMM d')}`;
    }
  } catch (error) {
    console.error("Error formatting week date range:", error);
    return '';
  }
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
