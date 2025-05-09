
import { addDays, addWeeks, format, isToday, isFuture, isPast, isWithinInterval, parseISO, startOfWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { Assignment, GroupedAssignments } from '@/types/assignment';

// Calculate week dates using date-fns
export const getWeekDates = (weekNumber: number, year: number = new Date().getFullYear()) => {
  // Create a date for January 1st of the given year
  const firstDayOfYear = new Date(year, 0, 1);
  
  // Find the first day of the first week (which contains January 4th per ISO standard)
  const firstWeekStart = startOfWeek(new Date(year, 0, 4), { weekStartsOn: 1 });
  
  // Calculate the start of our target week by adding (weekNumber - 1) weeks to the first week
  const targetWeekStart = addWeeks(firstWeekStart, weekNumber - 1);
  
  // The end of the week is 6 days after the start (start of week is Monday, end is Sunday)
  const targetWeekEnd = addDays(targetWeekStart, 6);
  
  return { start: targetWeekStart, end: targetWeekEnd };
};

// Sort dates with today first, then future days, then past days
export const sortDatesWithTodayFirst = (dates: string[]): string[] => {
  return dates.sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    
    // Check if today
    const aIsToday = isToday(dateA);
    const bIsToday = isToday(dateB);
    
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    
    // Check if future or past
    const aIsFuture = isFuture(dateA);
    const bIsFuture = isFuture(dateB);
    const aIsPast = isPast(dateA);
    const bIsPast = isPast(dateB);
    
    if (aIsFuture && bIsPast) return -1;
    if (aIsPast && bIsFuture) return 1;
    
    // If both are future or both are past, sort by date
    return dateA.getTime() - dateB.getTime();
  });
};

// Format date with capitalized first letter
export const formatDateWithCapital = (date: string, langCode: string = 'da-DK') => {
  const dateObj = new Date(date);
  // Get localized date string
  const formattedDate = dateObj.toLocaleDateString(langCode, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  
  // Capitalize first letter
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

// Check if a date is past, present, or future
export const getDateStatus = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  
  // Reset hours to compare only days
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  if (isToday(date)) return 'today';
  if (isPast(date)) return 'past';
  if (isFuture(date)) return 'future';
  return 'unknown';
};

// Generate all dates for a week
export const getAllWeekDays = (weekDates: { start: Date; end: Date }) => {
  const days = [];
  let currentDay = new Date(weekDates.start);

  while (currentDay <= weekDates.end) {
    days.push(format(currentDay, 'yyyy-MM-dd'));
    currentDay = addDays(currentDay, 1);
  }

  return days;
};

// Group assignments by day (this was missing)
export const groupAssignmentsByDay = (assignments: Assignment[]): GroupedAssignments => {
  return assignments.reduce((groups: GroupedAssignments, assignment) => {
    const date = assignment.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(assignment);
    return groups;
  }, {});
};
