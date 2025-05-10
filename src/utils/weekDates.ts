
// Generate the first and last day of a given week
export const getWeekDates = (weekOffset = 0) => {
  // Fixed dates for week 19 and week 20 in 2025
  // Week 19: May 5-11, 2025
  // Week 20: May 12-18, 2025
  const now = new Date(2025, 4, 10); // May 10th, 2025 (base date)
  
  let firstDayOfWeek: Date;
  let lastDayOfWeek: Date;
  
  if (weekOffset === 0) {
    // Week 19 (current week)
    firstDayOfWeek = new Date(2025, 4, 5); // May 5, 2025 (Monday)
    lastDayOfWeek = new Date(2025, 4, 11); // May 11, 2025 (Sunday)
  } else if (weekOffset === 1) {
    // Week 20 (next week)
    firstDayOfWeek = new Date(2025, 4, 12); // May 12, 2025 (Monday)
    lastDayOfWeek = new Date(2025, 4, 18); // May 18, 2025 (Sunday)
  } else if (weekOffset === -1) {
    // Week 18 (previous week)
    firstDayOfWeek = new Date(2025, 3, 28); // April 28, 2025 (Monday)
    lastDayOfWeek = new Date(2025, 4, 4); // May 4, 2025 (Sunday)
  } else {
    // Calculate any other week based on the offset from week 19
    firstDayOfWeek = new Date(2025, 4, 5 + (weekOffset * 7));
    lastDayOfWeek = new Date(2025, 4, 11 + (weekOffset * 7));
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
  // Since we're using May 10, 2025 as our reference date, just return 19
  return 19;
};
