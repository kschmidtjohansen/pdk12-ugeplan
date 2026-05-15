
import {
  parseISO,
  getISOWeek,
  getISOWeekYear,
  format,
  startOfISOWeek,
  endOfISOWeek,
  setISOWeek,
  setISOWeekYear,
} from "date-fns";

export interface WeekDateRange {
  start: Date;
  end: Date;
  weekNumber: number;
  year: number;
  /** Pre-formatted YYYY-MM-DD for cheap string compares */
  startStr: string;
  endStr: string;
}

// ------- Module-level caches -------
// Inputs are deterministic (week+year, or YYYY-MM-DD), so caching is always safe.

const weekDatesCache = new Map<string, WeekDateRange>();
const isoInfoCache = new Map<string, { week: number; year: number }>();
const ISO_INFO_CACHE_MAX = 1000;

/**
 * Get the date range for a specific ISO week number and year.
 * Result is memoized — repeat calls return the same object reference,
 * which keeps React useMemo / useEffect deps stable.
 */
export const getWeekDates = (weekNumber: number, year: number): WeekDateRange => {
  if (weekNumber < 1 || weekNumber > 53) {
    throw new Error(`Invalid week number: ${weekNumber}. Must be between 1 and 53.`);
  }

  const cacheKey = `${year}-${weekNumber}`;
  const cached = weekDatesCache.get(cacheKey);
  if (cached) return cached;

  const baseDate = new Date(year, 0, 4); // Jan 4th is always in ISO week 1
  const dateWithYear = setISOWeekYear(baseDate, year);
  const dateWithWeek = setISOWeek(dateWithYear, weekNumber);
  const start = startOfISOWeek(dateWithWeek);
  const end = endOfISOWeek(dateWithWeek);

  const result: WeekDateRange = {
    start,
    end,
    weekNumber,
    year,
    startStr: format(start, "yyyy-MM-dd"),
    endStr: format(end, "yyyy-MM-dd"),
  };

  weekDatesCache.set(cacheKey, result);
  return result;
};

/**
 * Memoized lookup of ISO week + year for a YYYY-MM-DD date string.
 * Cap entries with a simple FIFO eviction.
 */
export const getISOWeekInfoForDate = (dateStr: string): { week: number; year: number } => {
  const cached = isoInfoCache.get(dateStr);
  if (cached) return cached;

  const d = parseISO(dateStr);
  const info = { week: getISOWeek(d), year: getISOWeekYear(d) };

  if (isoInfoCache.size >= ISO_INFO_CACHE_MAX) {
    const firstKey = isoInfoCache.keys().next().value;
    if (firstKey !== undefined) isoInfoCache.delete(firstKey);
  }
  isoInfoCache.set(dateStr, info);
  return info;
};

/**
 * Get the current ISO week number and year
 */
export const getCurrentWeekInfo = () => {
  const now = new Date();
  return {
    week: getISOWeek(now),
    year: getISOWeekYear(now),
  };
};

/**
 * Get the current week dates
 */
export const getCurrentWeekDates = (week?: number, year?: number) => {
  if (week !== undefined && year !== undefined) {
    return getWeekDates(week, year);
  }
  const { week: currentWeek, year: currentYear } = getCurrentWeekInfo();
  return getWeekDates(currentWeek, currentYear);
};

/**
 * Get all days in the week as formatted date strings (YYYY-MM-DD)
 */
export const getAllWeekDays = (dateRange: { start: Date; end: Date }) => {
  const { start, end } = dateRange;
  const allDays: string[] = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    allDays.push(format(currentDate, "yyyy-MM-dd"));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return allDays;
};

// Backward-compat helpers
export const getCurrentWeekNumber = () => getCurrentWeekInfo().week;

export const getWeekNumber = (date: Date | string) => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return getISOWeek(dateObj);
};

export const getYearForDate = (date: Date | string) => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return getISOWeekYear(dateObj);
};
