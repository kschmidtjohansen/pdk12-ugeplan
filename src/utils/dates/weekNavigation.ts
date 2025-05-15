
import { getISOWeek, getISOWeekYear, lastDayOfYear, getWeek } from "date-fns";

/**
 * Get the previous ISO week number and year
 * Takes into account year boundaries
 */
export const getPreviousWeekInfo = (weekNumber: number, year: number) => {
  console.log(`Getting previous week from Week ${weekNumber}/${year}`);
  
  if (weekNumber > 1) {
    // Regular case - just decrease week number
    console.log(`Previous week: ${weekNumber - 1}/${year}`);
    return {
      week: weekNumber - 1,
      year
    };
  } else {
    // If at week 1, go to last week of previous year
    const prevYearDate = new Date(year - 1, 11, 28); // Dec 28 of previous year (always in the last week)
    const prevYearWeek = getISOWeek(prevYearDate);
    const prevYearISOYear = getISOWeekYear(prevYearDate);
    
    console.log(`Previous week from Week 1, ${year} -> Week ${prevYearWeek}, ${prevYearISOYear}`);
    
    return {
      week: prevYearWeek,
      year: prevYearISOYear
    };
  }
};

/**
 * Get the next ISO week number and year
 * Takes into account year boundaries
 */
export const getNextWeekInfo = (weekNumber: number, year: number) => {
  console.log(`Getting next week from Week ${weekNumber}/${year}`);
  
  // Get the last week number of the current year
  const lastDay = lastDayOfYear(new Date(year, 0, 1));
  const lastWeekOfYear = getISOWeek(lastDay);
  const isoYearOfLastWeek = getISOWeekYear(lastDay);
  
  console.log(`Last week of ${year} is Week ${lastWeekOfYear} (ISO year: ${isoYearOfLastWeek})`);
  
  // Check if we're at the last week of the year
  if (weekNumber === lastWeekOfYear && isoYearOfLastWeek === year) {
    // We're at the last week of the year, go to first week of next year
    console.log(`Next week from Week ${weekNumber}, ${year} -> Week 1, ${year + 1}`);
    return {
      week: 1,
      year: year + 1
    };
  } else {
    // Regular case - just increase week number
    console.log(`Next week: ${weekNumber + 1}/${year}`);
    return {
      week: weekNumber + 1,
      year
    };
  }
};
