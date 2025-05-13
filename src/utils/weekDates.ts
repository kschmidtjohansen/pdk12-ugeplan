
import { getISOWeek, getISOWeekYear, getYear, parseISO } from "date-fns";
import { format, setISOWeek, startOfISOWeek, endOfISOWeek, setISOWeekYear } from "date-fns";

/**
 * Get the date range for a specific ISO week number and year
 * ISO weeks start on Monday and end on Sunday
 */
export const getWeekDates = (weekNumber: number, year?: number) => {
  // If no year is provided, use the current year
  const targetYear = year || getYear(new Date());
  
  // Create a date based on the given ISO week number and year
  let baseDate = new Date();
  
  // Set the ISO week year first (important for correct week calculations)
  baseDate = setISOWeekYear(baseDate, targetYear);
  
  // Set the ISO week number
  baseDate = setISOWeek(baseDate, weekNumber);
  
  // Get the start of the ISO week (Monday)
  const weekStart = startOfISOWeek(baseDate);
  
  // Get the end of the ISO week (Sunday)
  const weekEnd = endOfISOWeek(baseDate);
  
  return {
    start: weekStart,
    end: weekEnd,
    weekNumber,
    year: getISOWeekYear(weekStart) // This may differ from the calendar year at year boundaries
  };
};

/**
 * Get the current ISO week number
 * Returns an object with both week number and year since 
 * ISO week numbers at year boundaries may belong to different years
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
    // If we're at week 1, go to the last week of the previous year
    // The last ISO week of a year can be 52 or 53
    const lastDate = new Date(year - 1, 11, 31); // December 31st of previous year
    return {
      week: getISOWeek(lastDate),
      year: year - 1
    };
  }
};

/**
 * Get the next ISO week number and year
 * Takes into account year boundaries
 */
export const getNextWeekInfo = (weekNumber: number, year: number) => {
  // Get the last week of the current year
  const lastDate = new Date(year, 11, 31); // December 31st
  const lastWeek = getISOWeek(lastDate);
  
  if (weekNumber < lastWeek) {
    return {
      week: weekNumber + 1,
      year
    };
  } else {
    // If we're at the last week, go to week 1 of the next year
    return {
      week: 1,
      year: year + 1
    };
  }
};

/**
 * Format a week date range as a string
 * Example: "6 - 12 maj" or "May 6 - 12"
 */
export const formatWeekDateRange = (weekDates: { start: Date; end: Date }, locale: string = 'en') => {
  try {
    if (locale === 'da') {
      return `${format(weekDates.start, 'd.')} - ${format(weekDates.end, 'd. MMMM', { locale: require('date-fns/locale/da') })}`;
    } else {
      return `${format(weekDates.start, 'MMMM d')} - ${format(weekDates.end, 'd')}`;
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
  return getYear(dateObj);
};
