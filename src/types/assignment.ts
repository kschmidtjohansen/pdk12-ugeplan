
export interface Assignment {
  id: string;
  title: string;
  description: string;
  date: string;
  fromTime: string;
  toTime: string;
  location: string;
  car: string | { id: string; name: string } | null;
  employees: string[]; // Guaranteed array of employee names as strings
  published: boolean;
  responsibleUser?: { id: string; name: string } | null;
}

export interface AssignmentFormData {
  date: string;
  title?: string;
  description?: string;
  fromTime?: string;
  toTime?: string;
  location?: string;
  car?: string;
  employees?: string[];
  responsibleUserId?: string;
}

export interface AssignmentFilterOptions {
  showUnpublished: boolean;
}

// Use proper ES module import instead of require
import { getCurrentWeekNumber } from '../utils/weekDates';

// Update getCurrentWeek function to use the imported function
export const getCurrentWeek = (): number => {
  return getCurrentWeekNumber();
};
