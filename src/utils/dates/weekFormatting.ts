
import { format } from "date-fns";
import { da } from "date-fns/locale"; // Import Danish locale

/**
 * Format a week date range as a string with proper Danish capitalization
 * Example: "Mandag 12. - Søndag 18. maj" (Danish)
 * or "Monday, May 12 - Sunday, May 18" (English)
 */
export const formatWeekDateRange = (weekDates: { start: Date; end: Date }, locale: string = 'en') => {
  try {
    if (locale === 'da') {
      // Danish format: "Mandag 12. - Søndag 18. maj"
      const startDay = format(weekDates.start, 'EEEE d.', { locale: da });
      const endDay = format(weekDates.end, 'EEEE d.', { locale: da });
      const month = format(weekDates.end, 'MMMM', { locale: da });
      
      // Debug the days of week to ensure Monday-Sunday
      console.log(`Start day: ${format(weekDates.start, 'EEEE')} (${weekDates.start.getDay()})`);
      console.log(`End day: ${format(weekDates.end, 'EEEE')} (${weekDates.end.getDay()})`);
      
      // Extract first letter and capitalize it, then add the rest of the string
      const startDayCapitalized = startDay.charAt(0).toUpperCase() + startDay.slice(1);
      const endDayCapitalized = endDay.charAt(0).toUpperCase() + endDay.slice(1);
      
      // Combine with proper Danish formatting
      const formattedRange = `${startDayCapitalized} - ${endDayCapitalized} ${month}`;
      console.log("Formatted date range (DA):", formattedRange);
      return formattedRange;
    } else {
      // English format: "Monday, May 12 - Sunday, May 18"
      const formattedRange = `${format(weekDates.start, 'EEEE, MMMM d')} - ${format(weekDates.end, 'EEEE, MMMM d')}`;
      console.log("Formatted date range (EN):", formattedRange);
      return formattedRange;
    }
  } catch (error) {
    console.error("Error formatting week date range:", error);
    return '';
  }
};
