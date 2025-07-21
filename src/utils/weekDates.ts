
// This file is kept for backward compatibility
// Import all functions from the new modular structure
export * from './dates/weekCore';
export * from './dates/weekNavigation';
export * from './dates/weekFormatting';

// Add the missing getCurrentWeek function
export const getCurrentWeek = () => {
  const now = new Date();
  const { week } = getCurrentWeekInfo();
  return `Uge ${week}`;
};

console.log("Legacy date utilities loaded from src/utils/weekDates.ts");
