
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { capitalizeFirstLetter } from "@/lib/utils";

/**
 * Format a week date range as a string with proper Danish capitalization
 */
export const formatWeekDateRange = (weekDates: { start: Date; end: Date }, locale: string = 'en') => {
  try {
    if (import.meta.env.DEV) {
      console.log(`formatWeekDateRange - Start: ${format(weekDates.start, 'yyyy-MM-dd')} (${format(weekDates.start, 'EEEE')}) - Day: ${weekDates.start.getDay()}`);
      if (import.meta.env.DEV) console.log(`formatWeekDateRange - End: ${format(weekDates.end, 'yyyy-MM-dd')} (${format(weekDates.end, 'EEEE')}) - Day: ${weekDates.end.getDay()}`);
    }
    
    if (weekDates.start.getDay() !== 1) {
      if (import.meta.env.DEV) console.error(`ERROR: Week start date is not Monday! It's ${format(weekDates.start, 'EEEE')} (day ${weekDates.start.getDay()})`);
    }
    
    if (weekDates.end.getDay() !== 0) {
      if (import.meta.env.DEV) console.error(`ERROR: Week end date is not Sunday! It's ${format(weekDates.end, 'EEEE')} (day ${weekDates.end.getDay()})`);
    }
    
    if (locale === 'da') {
      const startDay = format(weekDates.start, 'EEEE d.', { locale: da });
      const endDay = format(weekDates.end, 'EEEE d.', { locale: da });
      const month = format(weekDates.end, 'MMMM', { locale: da });
      
      const startDayCapitalized = capitalizeFirstLetter(startDay);
      const endDayCapitalized = capitalizeFirstLetter(endDay);
      const capitalizedMonth = capitalizeFirstLetter(month);
      
      return `${startDayCapitalized} - ${endDayCapitalized} ${capitalizedMonth}`;
    } else {
      return `${format(weekDates.start, 'EEEE, MMMM d')} - ${format(weekDates.end, 'EEEE, MMMM d')}`;
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error("Error formatting week date range:", error);
    return '';
  }
};
