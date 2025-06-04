
import { Assignment } from '@/types/assignment';
import { getWeek, getYear } from 'date-fns';

export const filterByWeek = (assignments: Assignment[], week: number, year: number): Assignment[] => {
  return assignments.filter(assignment => {
    const assignmentDate = new Date(assignment.date);
    const assignmentWeek = getWeek(assignmentDate);
    const assignmentYear = getYear(assignmentDate);
    
    return assignmentWeek === week && assignmentYear === year;
  });
};

export * from './weekCore';
export * from './weekFormatting';
export * from './weekNavigation';
