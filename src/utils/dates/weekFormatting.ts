
import { format } from "date-fns";
import { da } from "date-fns/locale"; // Import Danish locale
import { capitalizeFirstLetter } from "@/lib/utils";

/**
 * Format a week date range as a string with proper Danish capitalization
 * Example: "Mandag 12. - Søndag 18. Maj" (Danish)
 * or "Monday, May 12 - Sunday, May 18" (English)
 */
export const formatWeekDateRange = (weekDates: { start: Date; end: Date }, locale: string = 'en') => {
  try {
    // Log week start and end for debugging
    console.log(`formatWeekDateRange - Start: ${format(weekDates.start, 'yyyy-MM-dd')} (${format(weekDates.start, 'EEEE')}) - Day: ${weekDates.start.getDay()}`);
    console.log(`formatWeekDateRange - End: ${format(weekDates.end, 'yyyy-MM-dd')} (${format(weekDates.end, 'EEEE')}) - Day: ${weekDates.end.getDay()}`);
    
    // Verify ISO week boundaries (Monday to Sunday)
    if (weekDates.start.getDay() !== 1) {
      console.error(`ERROR: Week start date is not Monday! It's ${format(weekDates.start, 'EEEE')} (day ${weekDates.start.getDay()})`);
    }
    
    if (weekDates.end.getDay() !== 0) {
      console.error(`ERROR: Week end date is not Sunday! It's ${format(weekDates.end, 'EEEE')} (day ${weekDates.end.getDay()})`);
    }
    
    if (locale === 'da') {
      // Danish format: "Mandag 12. - Søndag 18. Maj"
      const startDay = format(weekDates.start, 'EEEE d.', { locale: da });
      const endDay = format(weekDates.end, 'EEEE d.', { locale: da });
      const month = format(weekDates.end, 'MMMM', { locale: da });
      
      // Extract first letter and capitalize it, then add the rest of the string
      const startDayCapitalized = capitalizeFirstLetter(startDay);
      const endDayCapitalized = capitalizeFirstLetter(endDay);
      const capitalizedMonth = capitalizeFirstLetter(month);
      
      // Combine with proper Danish formatting
      return `${startDayCapitalized} - ${endDayCapitalized} ${capitalizedMonth}`;
    } else {
      // English format: "Monday, May 12 - Sunday, May 18"
      return `${format(weekDates.start, 'EEEE, MMMM d')} - ${format(weekDates.end, 'EEEE, MMMM d')}`;
    }
  } catch (error) {
    console.error("Error formatting week date range:", error);
    return '';
  }
};
