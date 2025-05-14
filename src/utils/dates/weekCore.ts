
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, getWeek, getYear, parse } from 'date-fns';
import { da, enUS } from 'date-fns/locale';

// Define a type for the week dates
export interface WeekDates {
  start: Date;
  end: Date;
  days: Date[];
}

/**
 * Get the date range for a specific week number and year
 */
export const getWeekDates = (weekNumber: number, year: number): WeekDates => {
  // Create a date in the specified week (e.g., Monday of that week)
  // This creates a date in the ISO week format (where week 1 is the week with the first Thursday)
  // FIXED: Changed YYYY to yyyy to match date-fns v3 format requirements
  const mondayOfWeek = parse(`${year}-W${weekNumber}-1`, 'yyyy-ww-e', new Date(), { locale: enUS });
  
  // Start of week is the Monday
  const start = mondayOfWeek;
  
  // End of week is Sunday
  const end = endOfWeek(mondayOfWeek, { weekStartsOn: 1 });
  
  // Generate an array of all days in the week
  const days = eachDayOfInterval({ start, end });
  
  return { start, end, days };
};

/**
 * Format a date range as a string
 */
export const formatDateRange = (start: Date, end: Date, locale: string = 'da'): string => {
  const dateLocale = locale === 'da' ? da : enUS;
  const dateFormat = locale === 'da' ? 'd. MMMM' : 'MMMM d';
  
  const startFormat = format(start, dateFormat, { locale: dateLocale });
  const endFormat = format(end, dateFormat, { locale: dateLocale });
  
  return `${startFormat} - ${endFormat}`;
};

/**
 * Check if a date falls within a specific week
 */
export const isDateInWeek = (date: Date, weekNumber: number, year: number): boolean => {
  const weekDates = getWeekDates(weekNumber, year);
  const dateToCheck = new Date(date);
  
  return dateToCheck >= weekDates.start && dateToCheck <= weekDates.end;
};

/**
 * Check if two dates are the same day
 */
export const isSameDate = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return isSameDay(d1, d2);
};

/**
 * Get the current week number and year
 */
export const getCurrentWeekInfo = (): { week: number; year: number } => {
  const now = new Date();
  return {
    week: getWeek(now, { weekStartsOn: 1, firstWeekContainsDate: 4 }),
    year: getYear(now)
  };
};

/**
 * Get the current week's dates
 */
export const getCurrentWeekDates = (): WeekDates => {
  const { week, year } = getCurrentWeekInfo();
  return getWeekDates(week, year);
};

/**
 * Get the current week number
 */
export const getCurrentWeekNumber = (): number => {
  return getCurrentWeekInfo().week;
};

/**
 * Convert a date string to a Date object
 */
export const toDate = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * Format date for display
 */
export const formatDate = (date: Date | string, localeString: string = 'da'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dateLocale = localeString === 'da' ? da : enUS;
  return format(dateObj, 'd. MMMM yyyy', { locale: dateLocale });
};

/**
 * Format date in a short format (e.g., "15. maj" or "May 15")
 */
export const formatShortDate = (date: Date | string, localeString: string = 'da'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dateLocale = localeString === 'da' ? da : enUS;
  const dateFormat = localeString === 'da' ? 'd. MMM' : 'MMM d';
  return format(dateObj, dateFormat, { locale: dateLocale });
};
