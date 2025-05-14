
import { getISOWeek, getISOWeekYear, format, startOfISOWeek, endOfISOWeek, addDays } from "date-fns";
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

// Get all days in a week (Monday to Sunday following ISO standard)
export const getAllWeekDays = (
  { start, end }: { start: Date, end: Date, weekNumber?: number, year?: number }
): string[] => {
  const days: string[] = [];
  
  // Debug incoming dates
  console.log(`getAllWeekDays - Start: ${format(start, 'yyyy-MM-dd')} (${format(start, 'EEEE')}) - Day: ${start.getDay()}`);
  console.log(`getAllWeekDays - End: ${format(end, 'yyyy-MM-dd')} (${format(end, 'EEEE')}) - Day: ${end.getDay()}`);
  
  // We need to ensure we're working with a Monday to Sunday range
  // ISO weeks should already start on Monday (day 1) and end on Sunday (day 0)
  if (start.getDay() !== 1) {
    console.warn(`Start date is not Monday! Adjusting from ${format(start, 'EEEE')} to Monday`);
    start = startOfISOWeek(start); // Force to Monday
  }
  
  // Create 7 days starting from Monday (day 1)
  const currentDate = new Date(start);
  for (let i = 0; i < 7; i++) {
    const dateString = format(currentDate, 'yyyy-MM-dd');
    days.push(dateString);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Validate our week
  if (days.length === 7) {
    const firstDayDate = new Date(days[0]);
    const lastDayDate = new Date(days[6]);
    
    console.log(`Week days - First: ${days[0]} (${format(firstDayDate, 'EEEE')}, day ${firstDayDate.getDay()})`);
    console.log(`Week days - Last: ${days[6]} (${format(lastDayDate, 'EEEE')}, day ${lastDayDate.getDay()})`);
    
    // Verify we have Monday (1) to Sunday (0)
    if (firstDayDate.getDay() !== 1) {
      console.error(`ERROR: First day is not Monday! Got ${format(firstDayDate, 'EEEE')} (day ${firstDayDate.getDay()})`);
    }
    
    if (lastDayDate.getDay() !== 0) {
      console.error(`ERROR: Last day is not Sunday! Got ${format(lastDayDate, 'EEEE')} (day ${lastDayDate.getDay()})`);
    }
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
