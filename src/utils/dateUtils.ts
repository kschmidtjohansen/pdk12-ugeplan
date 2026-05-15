
import { format, isValid, parseISO, differenceInDays, addDays, parse, isWeekend, getDay, getISOWeek, isSameWeek } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { capitalizeFirstLetter } from '@/lib/utils';

// Format a date to YYYY-MM-DD
export const formatDateToYYYYMMDD = (date: Date): string => {
  if (!isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
};

// Parse a YYYY-MM-DD string to a Date
export const parseYYYYMMDD = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  try {
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    return isValid(date) ? date : null;
  } catch (e) {
    if (import.meta.env.DEV) console.error('Error parsing date:', e);
    return null;
  }
};

// Format a date for display
export const formatDateForDisplay = (date: Date | string | null): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, 'dd/MM/yyyy') : '';
  } catch (e) {
    if (import.meta.env.DEV) console.error('Error formatting date:', e);
    return '';
  }
};

/**
 * Format a date range with proper week numbers
 * - If dates are in the same week: "21. June 2025 - 27. June 2025 (Week 25)"
 * - If dates span multiple weeks: "21. June 2025 (Week 25) - 3. July 2025 (Week 27)"
 */
export const formatDateRangeWithWeeks = (
  startDate: Date, 
  endDate: Date, 
  languageCode: string = 'en', 
  weekLabel: string = 'Week'
): string => {
  try {
    const locale = languageCode === 'da' ? da : enUS;
    const startWeek = getISOWeek(startDate);
    const endWeek = getISOWeek(endDate);
    
    // Format individual dates
    const startFormatted = format(startDate, languageCode === 'da' ? 'd. MMM yyyy' : 'd MMM yyyy', { locale });
    const endFormatted = format(endDate, languageCode === 'da' ? 'd. MMM yyyy' : 'd MMM yyyy', { locale });
    
    // Check if both dates are in the same ISO week
    const sameWeek = isSameWeek(startDate, endDate, { weekStartsOn: 1 }); // ISO weeks start on Monday (1)
    
    if (sameWeek) {
      // If same week, show week number once at the end
      return `${startFormatted} - ${endFormatted} (${weekLabel} ${startWeek})`;
    } else {
      // If different weeks, show week number for each date
      return `${startFormatted} (${weekLabel} ${startWeek}) - ${endFormatted} (${weekLabel} ${endWeek})`;
    }
  } catch (e) {
    if (import.meta.env.DEV) console.error('Error formatting date range with weeks:', e);
    return `${startDate} - ${endDate}`;
  }
};

// Calculate the difference in days between two dates
export const daysBetween = (startDate: Date | string, endDate: Date | string): number => {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (!isValid(start) || !isValid(end)) return 0;
    
    // Add 1 to include both start and end days
    return differenceInDays(end, start) + 1;
  } catch (e) {
    if (import.meta.env.DEV) console.error('Error calculating days between:', e);
    return 0;
  }
};

// Check if a date is a weekend
export const isWeekendDay = (date: Date | string): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? isWeekend(dateObj) : false;
  } catch (e) {
    if (import.meta.env.DEV) console.error('Error checking weekend:', e);
    return false;
  }
};

// Check if a date is a Friday
export const isFriday = (date: Date | string): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    // Friday is day 5 in JavaScript's getDay (0 = Sunday, 1 = Monday, ..., 5 = Friday)
    return isValid(dateObj) ? getDay(dateObj) === 5 : false;
  } catch (e) {
    if (import.meta.env.DEV) console.error('Error checking if date is Friday:', e);
    return false;
  }
};

// Get default end time for a given date
export const getDefaultEndTime = (date: Date | string | null): string => {
  if (!date) return '16:00';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '16:00';
    
    // If it's Friday, return 15:30, otherwise return 16:00
    return isFriday(dateObj) ? '15:30' : '16:00';
  } catch (e) {
    if (import.meta.env.DEV) console.error('Error getting default end time:', e);
    return '16:00';
  }
};

// Format date with capitalized first letter of day and month
export const formatDateWithCapital = (dateString: string, language: string = 'en'): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    
    const locale = language === 'da' ? da : enUS;
    
    // Format the date with day of week, day with period, and month
    // For Danish: "Mandag, 26. Maj"
    // For English: "Monday, 26th May"
    if (language === 'da') {
      // Format with Danish pattern
      const formattedDate = format(date, 'EEEE, d. MMMM', { locale });
      
      // Capitalize first letter of day and month
      const parts = formattedDate.split(', ');
      if (parts.length === 2) {
        const [day, rest] = parts;
        const capitalizedDay = capitalizeFirstLetter(day);
        
        // Find the month part (after the day number and period)
        const monthParts = rest.split('. ');
        if (monthParts.length === 2) {
          const [dayNum, month] = monthParts;
          const capitalizedMonth = capitalizeFirstLetter(month);
          return `${capitalizedDay}, ${dayNum}. ${capitalizedMonth}`;
        }
        
        return `${capitalizedDay}, ${rest}`;
      }
      return formattedDate;
    } else {
      // For English, just use the default formatter
      return format(date, 'EEEE, d MMMM', { locale });
    }
  } catch (e) {
    if (import.meta.env.DEV) console.error('Error formatting date with capital:', e);
    return dateString;
  }
};

// Get the status of a date: past, today, or future
export const getDateStatus = (dateString: string): 'past' | 'today' | 'future' => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part
    
    const date = parseISO(dateString);
    if (!isValid(date)) return 'past'; // Default to past if invalid
    
    date.setHours(0, 0, 0, 0); // Reset time part for comparison
    
    if (date.getTime() < today.getTime()) return 'past';
    if (date.getTime() === today.getTime()) return 'today';
    return 'future';
  } catch (e) {
    if (import.meta.env.DEV) console.error('Error getting date status:', e);
    return 'past'; // Default to past on error
  }
};

// Get all days of the week, used in AssignmentList.tsx
export const getAllWeekDays = ({ start, end }: { start: Date; end: Date }) => {
  const dates: string[] = [];
  let currentDate = start;

  while (currentDate <= end) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
};

// Group assignments by day, used in usePlannerAssignments.ts
export const groupAssignmentsByDay = (assignments: any[]) => {
  return assignments.reduce((groups: Record<string, any[]>, assignment) => {
    const date = assignment.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(assignment);
    return groups;
  }, {});
};

export default {
  formatDateToYYYYMMDD,
  parseYYYYMMDD,
  formatDateForDisplay,
  daysBetween,
  isWeekendDay,
  isFriday,
  getDefaultEndTime,
  formatDateWithCapital,
  getDateStatus,
  getAllWeekDays,
  groupAssignmentsByDay,
  formatDateRangeWithWeeks
};
