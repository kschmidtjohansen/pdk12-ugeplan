import React, { createContext, useContext } from 'react';
import { Assignment } from '@/types/assignment';

export interface PlannerActions {
  /** Move a single assignment a number of days forward/backward, with undo. */
  quickMove: (assignment: Assignment, days: number) => void | Promise<void>;
}

const PlannerActionsContext = createContext<PlannerActions | null>(null);

export const PlannerActionsProvider: React.FC<{ value: PlannerActions; children: React.ReactNode }> = ({
  value,
  children,
}) => <PlannerActionsContext.Provider value={value}>{children}</PlannerActionsContext.Provider>;

/** Returns planner quick actions, or null outside the planner. */
export const usePlannerActions = (): PlannerActions | null => useContext(PlannerActionsContext);
