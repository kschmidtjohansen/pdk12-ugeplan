
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

// COMPLETELY REWRITTEN: Get all days in a week (guaranteed Monday to Sunday)
export const getAllWeekDays = (
  { start, end }: { start: Date, end: Date, weekNumber?: number, year?: number }
): string[] => {
  const days: string[] = [];
  
  // Debug log week range
  console.log(`FIXED getAllWeekDays - Incoming range: ${format(start, 'yyyy-MM-dd')} (${format(start, 'EEEE')}) to ${format(end, 'yyyy-MM-dd')} (${format(end, 'EEEE')})`);
  
  // COMPLETELY REIMPLEMENTED: Forget about the provided start/end dates
  // Instead, use the first Monday of or before the start date as our starting point
  // This guarantees we start on a Monday regardless of the input
  const mondayStart = new Date(start);
  
  // Adjust to Monday (day 1) if not already Monday
  while (mondayStart.getDay() !== 1) {
    // If Sunday (0), go back 6 days, otherwise go back to previous Monday
    if (mondayStart.getDay() === 0) {
      mondayStart.setDate(mondayStart.getDate() - 6);
    } else {
      mondayStart.setDate(mondayStart.getDate() - (mondayStart.getDay() - 1));
    }
  }
  
  // Clear time portion
  mondayStart.setHours(0, 0, 0, 0);
  
  console.log(`FIXED: Using Monday start date: ${format(mondayStart, 'yyyy-MM-dd')} (${format(mondayStart, 'EEEE')})`);
  
  // Explicitly create 7 days from Monday (1) to Sunday (0)
  const currentDate = new Date(mondayStart);
  
  // Add Monday through Sunday (7 days total)
  for (let i = 0; i < 7; i++) {
    const dateString = currentDate.toISOString().split('T')[0];
    days.push(dateString);
    
    // Debug each day we add
    console.log(`FIXED: Adding day ${i+1}: ${dateString} (${format(currentDate, 'EEEE')}) - day of week: ${currentDate.getDay()}`);
    
    // Go to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Validate the resulting week
  if (days.length === 7) {
    // Verify we have Monday to Sunday
    const firstDayDate = new Date(days[0]);
    const lastDayDate = new Date(days[6]);
    
    console.log(`FIXED: First day: ${format(firstDayDate, 'EEEE')} (${firstDayDate.getDay()})`);
    console.log(`FIXED: Last day: ${format(lastDayDate, 'EEEE')} (${lastDayDate.getDay()})`);
    
    if (firstDayDate.getDay() !== 1 || lastDayDate.getDay() !== 0) {
      console.error(`FIXED FAILED: Week does NOT start on Monday and end on Sunday! First: ${format(firstDayDate, 'EEEE')}, Last: ${format(lastDayDate, 'EEEE')}`);
    } else {
      console.log('FIXED SUCCESS: Created Monday to Sunday week range');
    }
  } else {
    console.error(`FIXED FAILED: Week has incorrect length: ${days.length} days`);
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
