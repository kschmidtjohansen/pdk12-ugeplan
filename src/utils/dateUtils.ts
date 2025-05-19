
import { format, isValid, formatISO, parseISO, differenceInDays, addDays, parse, isWeekend, getDay } from 'date-fns';
import { da, enUS } from 'date-fns/locale';

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

// Format date with capitalized first letter of day and month
export const formatDateWithCapital = (dateString: string, language: string = 'en'): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    
    const locale = language === 'da' ? da : enUS;
    
    // Format the date with day of week, day, and month
    return format(date, 'EEEE, d MMMM', { locale });
  } catch (e) {
    console.error('Error formatting date with capital:', e);
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
    console.error('Error getting date status:', e);
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
  groupAssignmentsByDay
};
