
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
    let options;
    
    if (locale === 'da') {
      options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      } as Intl.DateTimeFormatOptions;
      
      // Format like: Mandag d. 5. maj
      const formattedDate = date.toLocaleDateString('da-DK', options);
      return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    } else {
      // Format like: Monday, May 5
      options = {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      } as Intl.DateTimeFormatOptions;
      
      return date.toLocaleDateString('en-US', options);
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Fall back to original string if formatting fails
  }
};

// Get all days in a week (for an inclusive date range)
export const getAllWeekDays = (
  { start, end }: { start: Date, end: Date, weekNumber?: number, year?: number }
): string[] => {
  const days: string[] = [];
  const currentDate = new Date(start);
  
  // Set to beginning of the day
  currentDate.setHours(0, 0, 0, 0);
  
  // Loop through each day until the end date
  while (currentDate <= end) {
    const dateString = currentDate.toISOString().split('T')[0];
    days.push(dateString);
    
    // Go to the next day
    currentDate.setDate(currentDate.getDate() + 1);
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
