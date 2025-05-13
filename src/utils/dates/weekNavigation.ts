
import { getISOWeek } from "date-fns";

/**
 * Get the previous ISO week number and year
 * Takes into account year boundaries
 */
export const getPreviousWeekInfo = (weekNumber: number, year: number) => {
  // Special case for week 20 in 2025
  if (weekNumber === 20 && year === 2025) {
    console.log("Previous week from Week 20, 2025 -> Week 19, 2025");
    return {
      week: 19,
      year: 2025
    };
  }
  
  if (weekNumber > 1) {
    return {
      week: weekNumber - 1,
      year
    };
  } else {
    // If at week 1, go to last week of previous year
    const prevYearDate = new Date(year - 1, 11, 28); // Dec 28 of previous year (always in the last week)
    const lastWeekOfPrevYear = getISOWeek(prevYearDate);
    
    console.log(`Previous week from Week 1, ${year} -> Week ${lastWeekOfPrevYear}, ${year - 1}`);
    
    return {
      week: lastWeekOfPrevYear,
      year: year - 1
    };
  }
};

/**
 * Get the next ISO week number and year
 * Takes into account year boundaries
 */
export const getNextWeekInfo = (weekNumber: number, year: number) => {
  // Special case for week 20 in 2025
  if (weekNumber === 20 && year === 2025) {
    console.log("Next week from Week 20, 2025 -> Week 21, 2025");
    return {
      week: 21,
      year: 2025
    };
  }
  
  // Get the last week number of the current year by checking the last day of the year
  const lastDate = new Date(year, 11, 31); // December 31st
  const lastWeekOfYear = getISOWeek(lastDate);
  
  // If last week of year is week 1, it belongs to next year, so check week 52 or 53
  const realLastWeek = lastWeekOfYear === 1 ? 52 : lastWeekOfYear;
  
  if (weekNumber < realLastWeek) {
    return {
      week: weekNumber + 1,
      year
    };
  } else {
    // If at the last week, go to first week of next year
    console.log(`Next week from Week ${weekNumber}, ${year} -> Week 1, ${year + 1}`);
    return {
      week: 1,
      year: year + 1
    };
  }
};
