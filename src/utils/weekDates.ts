
// Generate the first and last day of a given week
export const getWeekDates = (weekOffset = 0) => {
  // Get current date
  const now = new Date();
  
  // Get the first day of the current week (Sunday)
  const firstDayOfWeek = new Date(now);
  const day = firstDayOfWeek.getDay() || 7; // Convert Sunday from 0 to 7
  firstDayOfWeek.setDate(firstDayOfWeek.getDate() - (day - 1) + (weekOffset * 7));
  firstDayOfWeek.setHours(0, 0, 0, 0);
  
  // Get the last day of the current week (Saturday)
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);
  
  return {
    start: firstDayOfWeek,
    end: lastDayOfWeek
  };
};

