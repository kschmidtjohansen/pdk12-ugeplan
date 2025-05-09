
// Generate the first and last day of a given week
export const getWeekDates = (weekOffset = 0) => {
  // Get current date
  const now = new Date();
  
  // Get the first day of the current week (Monday)
  const firstDayOfWeek = new Date(now);
  const day = firstDayOfWeek.getDay() || 7; // Convert Sunday from 0 to 7
  firstDayOfWeek.setDate(firstDayOfWeek.getDate() - (day - 1) + (weekOffset * 7));
  firstDayOfWeek.setHours(0, 0, 0, 0);
  
  // Get the last day of the current week (Sunday)
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);
  
  return {
    start: firstDayOfWeek,
    end: lastDayOfWeek
  };
};

// Calculate the current week number
export const getCurrentWeekNumber = () => {
  const now = new Date();
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  const dayNum = now.getDay() || 7;
  now.setDate(now.getDate() + 4 - dayNum);
  
  // Get first day of year
  const yearStart = new Date(now.getFullYear(), 0, 1);
  
  // Calculate full weeks to nearest Thursday
  const weekNumber = Math.ceil((((now.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  return weekNumber;
};
