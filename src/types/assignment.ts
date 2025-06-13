
export interface Assignment {
  id: string;
  title: string;
  description: string;
  date: string;
  fromTime: string;
  toTime: string;
  location: string;
  car: string | { id: string; name: string } | null; // Keep for backward compatibility
  cars: Array<{ id: string; name: string; carNumber: string }>; // Updated to match the data structure
  employees: Array<{ id: string; name: string; email: string }>; // Updated to match the data structure  
  published: boolean;
  responsibleUser?: { id: string; name: string } | null;
  createdAt?: Date;
  updatedAt?: Date;
  type?: 'waterDamage' | 'fireDamage' | 'mold' | 'other';
}

export interface AssignmentFormData {
  date: string;
  title?: string;
  description?: string;
  fromTime?: string;
  toTime?: string;
  location?: string;
  car?: string; // Keep for backward compatibility
  cars?: string[]; // New field for multiple cars
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
