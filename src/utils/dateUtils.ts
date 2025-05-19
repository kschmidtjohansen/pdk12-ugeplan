
import { format, isValid, formatISO, parseISO, differenceInDays, addDays, parse, isWeekend, getDay } from 'date-fns';

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
    console.error('Error parsing date:', e);
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
    console.error('Error formatting date:', e);
    return '';
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
    console.error('Error calculating days between:', e);
    return 0;
  }
};

// Check if a date is a weekend
export const isWeekendDay = (date: Date | string): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? isWeekend(dateObj) : false;
  } catch (e) {
    console.error('Error checking weekend:', e);
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
    console.error('Error checking if date is Friday:', e);
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
    console.error('Error getting default end time:', e);
    return '16:00';
  }
};

export default {
  formatDateToYYYYMMDD,
  parseYYYYMMDD,
  formatDateForDisplay,
  daysBetween,
  isWeekendDay,
  isFriday,
  getDefaultEndTime,
};
