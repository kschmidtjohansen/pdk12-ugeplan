
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

// Mock data
const initialAssignments = [
  {
    id: '1',
    title: 'Vandskade inspektion',
    description: 'Komplet inspektion af vandskade i kælderområdet.',
    date: '2025-05-06',
    fromTime: '09:00',
    toTime: '11:00',
    location: 'Aarhus Central',
    car: 'Van 1',
    employees: ['John Doe'],
  },
  {
    id: '2',
    title: 'Brandskade restaurering',
    description: 'Første vurdering af brandskade i lejlighed.',
    date: '2025-05-07',
    fromTime: '13:00',
    toTime: '16:00',
    location: 'København Syd',
    car: 'Truck 3',
    employees: ['Jane Smith'],
  },
  {
    id: '3',
    title: 'Skimmelsvamp vurdering',
    description: 'Inspicer og vurder skimmelsvamp skade på køkkenvægge.',
    date: '2025-05-09',
    fromTime: '10:00',
    toTime: '12:30',
    location: 'Odense Øst',
    car: 'Van 2',
    employees: ['Mike Johnson', 'Anna Williams'],
  },
  {
    id: '4',
    title: 'Vandskade opfølgning',
    description: 'Opfølgning på tidligere vandskade.',
    date: '2025-05-13', // Next week
    fromTime: '14:00',
    toTime: '16:00',
    location: 'Aalborg',
    car: 'Van 1',
    employees: ['John Doe'],
  },
  {
    id: '5',
    title: 'Brandinspektion',
    description: 'Rutinemæssig inspektion af brandskader.',
    date: '2025-05-15', // Next week
    fromTime: '09:00',
    toTime: '11:30',
    location: 'Esbjerg',
    car: 'Sedan 1',
    employees: ['Jane Smith'],
  },
];

export const getWeekDates = (weekNumber: number, year: number = new Date().getFullYear()) => {
  // Create a date for January 1st of the given year
  const januaryFirst = new Date(year, 0, 1);
  
  // Calculate days to first week
  // If January 1st is not a Monday, find the first Monday
  const daysOffset = (8 - januaryFirst.getDay()) % 7;
  
  // Calculate the date of the first day of the given week
  const firstDayOfWeek = new Date(year, 0, 1 + daysOffset + (weekNumber - 1) * 7);
  
  // Calculate the last day of the week (6 days after the first day)
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  
  return { start: firstDayOfWeek, end: lastDayOfWeek };
};

export const usePlannerAssignments = (selectedWeek?: number) => {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Filter assignments by the selected week
  const filteredAssignments = selectedWeek 
    ? assignments.filter(assignment => {
        const assignmentDate = parseISO(assignment.date);
        const { start, end } = getWeekDates(selectedWeek);
        return isWithinInterval(assignmentDate, { start, end });
      })
    : assignments;

  const createAssignment = (assignment: Assignment) => {
    setAssignments([...assignments, assignment]);
    toast({
      title: t("planner.assignmentCreated"),
      description: t("planner.assignmentCreatedMsg", { title: assignment.title }),
    });
    return assignment;
  };

  const updateAssignment = (updatedAssignment: Assignment) => {
    setAssignments(
      assignments.map((a) =>
        a.id === updatedAssignment.id ? updatedAssignment : a
      )
    );
    toast({
      title: t("planner.assignmentUpdated"),
      description: t("planner.assignmentUpdatedMsg", { title: updatedAssignment.title }),
    });
    return updatedAssignment;
  };

  const deleteAssignment = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
    toast({
      title: t("planner.assignmentDeleted"),
      description: t("planner.assignmentDeletedMsg"),
    });
  };

  return {
    assignments: filteredAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment
  };
};
