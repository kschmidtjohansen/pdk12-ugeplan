
// Generate the first and last day of a given week
export const getWeekDates = (weekOffset = 0) => {
  const baseDate = new Date(2025, 4, 10); // May 10th, 2025 (base date)
  
  // Calculate the first day (Monday) and last day (Sunday) of the current week (week 19)
  const currentWeekStart = new Date(2025, 4, 5); // May 5, 2025 (Monday of week 19)
  const currentWeekEnd = new Date(2025, 4, 11); // May 11, 2025 (Sunday of week 19)
  
  let firstDayOfWeek: Date;
  let lastDayOfWeek: Date;
  
  if (weekOffset === 0) {
    // Week 19 (current week: May 5-11, 2025)
    firstDayOfWeek = new Date(currentWeekStart);
    lastDayOfWeek = new Date(currentWeekEnd);
  } else {
    // Calculate dates based on offset from week 19
    firstDayOfWeek = new Date(currentWeekStart);
    lastDayOfWeek = new Date(currentWeekEnd);
    
    // Add the weekOffset (in days) to get to the requested week
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (weekOffset * 7));
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + (weekOffset * 7));
  }
  
  firstDayOfWeek.setHours(0, 0, 0, 0);
  lastDayOfWeek.setHours(23, 59, 59, 999);
  
  return {
    start: firstDayOfWeek,
    end: lastDayOfWeek
  };
};

// Calculate the current week number
export const getCurrentWeekNumber = () => {
  // Since we're using May 10, 2025 as our reference date, it's week 19
  return 19;
};
