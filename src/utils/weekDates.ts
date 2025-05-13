
import { parseISO, getISOWeek, getISOWeekYear, getYear } from "date-fns";
import { 
  format,
  startOfISOWeek, 
  endOfISOWeek, 
  setISOWeek, 
  setISOWeekYear,
  getDay,
  addDays,
  subDays
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
  const weekStart = startOfISOWeek(baseDate);
  
  // Get the Sunday of that week (end of ISO week)
  const weekEnd = endOfISOWeek(baseDate);
  
  // Ensure we're getting Monday (1) to Sunday (0)
  const startDay = weekStart.getDay();
  const endDay = weekEnd.getDay();
  
  console.log(`Raw week start day: ${startDay} (${format(weekStart, 'EEEE')})`);
  console.log(`Raw week end day: ${endDay} (${format(weekEnd, 'EEEE')})`);
  
  // Log each day of the week for debugging
  let currentDay = new Date(weekStart);
  console.log("WEEK DAYS CHECK:");
  for (let i = 0; i < 7; i++) {
    console.log(`Day ${i+1}: ${format(currentDay, 'yyyy-MM-dd')} - ${format(currentDay, 'EEEE')}`);
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  // Add comprehensive debug logging
  console.log(`Week ${weekNumber}, ${year} - Start: ${format(weekStart, 'yyyy-MM-dd')} (${format(weekStart, 'EEEE', { locale: da })})`);
  console.log(`Week ${weekNumber}, ${year} - End: ${format(weekEnd, 'yyyy-MM-dd')} (${format(weekEnd, 'EEEE', { locale: da })})`);
  
  // If we're debugging week 20, add extra logging
  if (weekNumber === 20 && year === 2025) {
    console.log("DEBUGGING WEEK 20 OF 2025:");
    for (let i = 0; i <= 6; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      console.log(`  Day ${i+1}: ${format(day, 'yyyy-MM-dd')} - ${format(day, 'EEEE d. MMMM', { locale: da })}`);
    }
  }
  
  // Create date objects that are timezone-safe for comparison
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
  // Special case for week 20 in 2025
  if (weekNumber === 20 && year === 2025) {
    console.log("Previous week from Week 20, 2025 -> Week 19, 2025");
    return {
      week: 19,
      year: 2025
    };
  }
  
  if (weekNumber > 1) {
    return {
      week: weekNumber - 1,
      year
    };
  } else {
    // If at week 1, go to last week of previous year
    const prevYearDate = new Date(year - 1, 11, 28); // Dec 28 of previous year (always in the last week)
    const lastWeekOfPrevYear = getISOWeek(prevYearDate);
    
    console.log(`Previous week from Week 1, ${year} -> Week ${lastWeekOfPrevYear}, ${year - 1}`);
    
    return {
      week: lastWeekOfPrevYear,
      year: year - 1
    };
  }
};

/**
 * Get the next ISO week number and year
 * Takes into account year boundaries
 */
export const getNextWeekInfo = (weekNumber: number, year: number) => {
  // Special case for week 20 in 2025
  if (weekNumber === 20 && year === 2025) {
    console.log("Next week from Week 20, 2025 -> Week 21, 2025");
    return {
      week: 21,
      year: 2025
    };
  }
  
  // Get the last week number of the current year by checking the last day of the year
  const lastDate = new Date(year, 11, 31); // December 31st
  const lastWeekOfYear = getISOWeek(lastDate);
  
  // If last week of year is week 1, it belongs to next year, so check week 52 or 53
  const realLastWeek = lastWeekOfYear === 1 ? 52 : lastWeekOfYear;
  
  if (weekNumber < realLastWeek) {
    return {
      week: weekNumber + 1,
      year
    };
  } else {
    // If at the last week, go to first week of next year
    console.log(`Next week from Week ${weekNumber}, ${year} -> Week 1, ${year + 1}`);
    return {
      week: 1,
      year: year + 1
    };
  }
};

/**
 * Format a week date range as a string with proper Danish capitalization
 * Example: "Mandag 12. - Søndag 18. maj" (Danish)
 * or "Monday, May 12 - Sunday, May 18" (English)
 */
export const formatWeekDateRange = (weekDates: { start: Date; end: Date }, locale: string = 'en') => {
  try {
    if (locale === 'da') {
      // Danish format: "Mandag 12. - Søndag 18. maj"
      const startDay = format(weekDates.start, 'EEEE d.', { locale: da });
      const endDay = format(weekDates.end, 'EEEE d.', { locale: da });
      const month = format(weekDates.end, 'MMMM', { locale: da });
      
      // Debug the days of week to ensure Monday-Sunday
      console.log(`Start day: ${format(weekDates.start, 'EEEE')} (${weekDates.start.getDay()})`);
      console.log(`End day: ${format(weekDates.end, 'EEEE')} (${weekDates.end.getDay()})`);
      
      // Extract first letter and capitalize it, then add the rest of the string
      const startDayCapitalized = startDay.charAt(0).toUpperCase() + startDay.slice(1);
      const endDayCapitalized = endDay.charAt(0).toUpperCase() + endDay.slice(1);
      
      // Combine with proper Danish formatting
      const formattedRange = `${startDayCapitalized} - ${endDayCapitalized} ${month}`;
      console.log("Formatted date range (DA):", formattedRange);
      return formattedRange;
    } else {
      // English format: "Monday, May 12 - Sunday, May 18"
      const formattedRange = `${format(weekDates.start, 'EEEE, MMMM d')} - ${format(weekDates.end, 'EEEE, MMMM d')}`;
      console.log("Formatted date range (EN):", formattedRange);
      return formattedRange;
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
