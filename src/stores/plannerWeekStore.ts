import { useSyncExternalStore } from 'react';
import { getISOWeek, getISOWeekYear } from 'date-fns';

interface PlannerWeekState {
  week: number;
  year: number;
}

const STORAGE_WEEK_KEY = 'plannerSelectedWeek';
const STORAGE_YEAR_KEY = 'plannerSelectedYear';

function initialState(): PlannerWeekState {
  if (typeof window === 'undefined') {
    const now = new Date();
    return { week: getISOWeek(now), year: getISOWeekYear(now) };
  }
  const w = parseInt(localStorage.getItem(STORAGE_WEEK_KEY) || '', 10);
  const y = parseInt(localStorage.getItem(STORAGE_YEAR_KEY) || '', 10);
  const now = new Date();
  return {
    week: Number.isFinite(w) ? w : getISOWeek(now),
    year: Number.isFinite(y) ? y : getISOWeekYear(now),
  };
}

let state: PlannerWeekState = initialState();
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => state;

export function setPlannerWeek(week: number, year: number) {
  if (state.week === week && state.year === year) return;
  state = { week, year };
  listeners.forEach((l) => l());
}

export function usePlannerWeek(): PlannerWeekState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
