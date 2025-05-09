export interface Assignment {
  id: string;
  title: string;
  description: string;
  date: string;
  fromTime: string;
  toTime: string;
  location: string;
  car: string | { id: string; name: string } | null;
  employees: string[];
  published: boolean;
}

export interface AssignmentFilterOptions {
  showUnpublished: boolean;
}

// Update getCurrentWeek function to use the getCurrentWeekNumber from utils
export const getCurrentWeek = (): number => {
  const { getCurrentWeekNumber } = require('../utils/weekDates');
  return getCurrentWeekNumber();
};
