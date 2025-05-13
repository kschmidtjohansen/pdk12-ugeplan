
import { getISOWeek, getISOWeekYear, format } from "date-fns";
import { 
  startOfISOWeek, 
  endOfISOWeek, 
  setISOWeek, 
  setISOWeekYear
} from "date-fns";
import { da } from "date-fns/locale"; // Import Danish locale

// Group assignments by day (YYYY-MM-DD format)
export const groupAssignmentsByDay = (assignments: any[]) => {
  return assignments.reduce((acc, assignment) => {
    const date = assignment.date ? assignment.date.split('T')[0] : 'Unknown';
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(assignment);
    return acc;
  }, {});
};

// Format date with capital first letter and proper localization
export const formatDateWithCapital = (dateString: string, locale: string = 'en'): string => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    // Format based on locale
    if (locale === 'da') {
      // Format like: "Mandag d. 5. maj" with capitalized first letter
      const formatted = format(date, "EEEE 'd.' d'.' MMMM", { locale: da });
      // Ensure first letter is capitalized
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } else {
      // Format like: "Monday, May 5"
      return format(date, "EEEE, MMMM d");
    }
  } catch (error) {
    console.error("Error formatting date:", error, "for date string:", dateString);
    return dateString; // Fall back to original string if formatting fails
  }
};

// Get all days in a week (for an inclusive date range)
export const getAllWeekDays = (
  { start, end }: { start: Date, end: Date, weekNumber?: number, year?: number }
): string[] => {
  const days: string[] = [];
  
  // Debug log week range
  console.log(`Getting all week days from: ${format(start, 'yyyy-MM-dd')} (${format(start, 'EEEE')}) to ${format(end, 'yyyy-MM-dd')} (${format(end, 'EEEE')})`);
  
  // Ensure start day is Monday (ISO week start)
  if (start.getDay() !== 1) {
    console.warn(`Start day is not Monday! Got: ${format(start, 'EEEE')} (day ${start.getDay()})`);
  }
  
  // Ensure end day is Sunday (ISO week end)
  if (end.getDay() !== 0) {
    console.warn(`End day is not Sunday! Got: ${format(end, 'EEEE')} (day ${end.getDay()})`);
  }
  
  // Create a new date object to avoid modifying the original start date
  const currentDate = new Date(start);
  
  // Set to beginning of the day
  currentDate.setHours(0, 0, 0, 0);
  
  // Loop through each day until the end date (inclusive)
  while (currentDate <= end) {
    const dateString = currentDate.toISOString().split('T')[0];
    days.push(dateString);
    
    // Debug each day we add
    console.log(`Adding day: ${dateString} (${format(currentDate, 'EEEE')})`);
    
    // Go to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Validate week days
  if (days.length === 7) {
    console.log(`Week has correct length: ${days.length} days`);
  } else {
    console.warn(`Week has INCORRECT length: ${days.length} days`);
  }
  
  return days;
};

// Determine if a date is in the past, today, or in the future
export const getDateStatus = (dateString: string): 'past' | 'today' | 'future' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  
  if (date.getTime() < today.getTime()) {
    return 'past';
  } else if (date.getTime() === today.getTime()) {
    return 'today';
  } else {
    return 'future';
  }
};

// Get ISO week number and year for a given date
export const getIsoWeekInfo = (date: Date) => {
  return {
    week: getISOWeek(date),
    year: getISOWeekYear(date)
  };
};
