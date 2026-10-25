import { createContext, useContext } from 'react';
import type { Assignment } from '@/types/assignment';
import type { Employee } from '@/types/employee';
import type { WeekSummary } from '@/utils/plannerOperations';

export interface PlannerWeekData {
  assignments: Assignment[];
  employees: Employee[];
  summary: WeekSummary;
}
const PlannerWeekDataContext = createContext<PlannerWeekData | null>(null);
export const PlannerWeekDataProvider = PlannerWeekDataContext.Provider;
export const usePlannerWeekData = () => useContext(PlannerWeekDataContext);