
import { format } from "date-fns";
import { da } from "date-fns/locale"; // Import Danish locale

/**
 * Format a week date range as a string with proper Danish capitalization
 * Example: "Mandag 12. - Søndag 18. maj" (Danish)
 * or "Monday, May 12 - Sunday, May 18" (English)
 */
export const formatWeekDateRange = (weekDates: { start: Date; end: Date }, locale: string = 'en') => {
  try {
    // Log week start and end for debugging
    console.log(`formatWeekDateRange - Start: ${format(weekDates.start, 'yyyy-MM-dd')} (${format(weekDates.start, 'EEEE')})`);
    console.log(`formatWeekDateRange - End: ${format(weekDates.end, 'yyyy-MM-dd')} (${format(weekDates.end, 'EEEE')})`);
    
    if (locale === 'da') {
      // Danish format: "Mandag 12. - Søndag 18. maj"
      const startDay = format(weekDates.start, 'EEEE d.', { locale: da });
      const endDay = format(weekDates.end, 'EEEE d.', { locale: da });
      const month = format(weekDates.end, 'MMMM', { locale: da });
      
      // Extract first letter and capitalize it, then add the rest of the string
      const startDayCapitalized = startDay.charAt(0).toUpperCase() + startDay.slice(1);
      const endDayCapitalized = endDay.charAt(0).toUpperCase() + endDay.slice(1);
      
      // Combine with proper Danish formatting
      return `${startDayCapitalized} - ${endDayCapitalized} ${month}`;
    } else {
      // English format: "Monday, May 12 - Sunday, May 18"
      return `${format(weekDates.start, 'EEEE, MMMM d')} - ${format(weekDates.end, 'EEEE, MMMM d')}`;
    }
  } catch (error) {
    console.error("Error formatting week date range:", error);
    return '';
  }
};
