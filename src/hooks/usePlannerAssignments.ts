
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { startOfWeek, endOfWeek, addDays, isWithinInterval, parseISO, format } from 'date-fns';
import { da } from 'date-fns/locale';

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
    published: true
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
    published: false
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
    published: false
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
    published: false
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
    published: false
  },
];

export const getWeekDates = (weekNumber: number, year: number = new Date().getFullYear()) => {
  // Calculate the first day of the first week of the year
  // In ISO-8601, the first week is the one that contains the first Thursday of the year
  const firstDayOfYear = new Date(year, 0, 1);
  const dayOfWeek = firstDayOfYear.getDay() || 7; // Convert Sunday (0) to 7 for ISO week
  
  // Days to add to get to the first Monday of the year
  const daysToAdd = (8 - dayOfWeek) % 7;
  
  // First Monday of the year
  const firstMonday = new Date(year, 0, 1 + daysToAdd);
  
  // Add (weekNumber - 1) weeks to get to the requested week's Monday
  const monday = new Date(firstMonday);
  monday.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
  
  // Calculate Sunday by adding 6 days
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return { start: monday, end: sunday };
};

export const usePlannerAssignments = (selectedWeek?: number) => {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const { toast } = useToast();
  const { t, currentLanguage } = useTranslation();

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

  const publishAssignments = (assignmentIds: string[]) => {
    setAssignments(
      assignments.map((a) =>
        assignmentIds.includes(a.id) ? { ...a, published: true } : a
      )
    );
    toast({
      title: t("planner.assignmentsPublished"),
      description: t("planner.assignmentsPublishedMsg"),
    });
  };

  const publishAssignment = (assignmentId: string) => {
    setAssignments(
      assignments.map((a) =>
        a.id === assignmentId ? { ...a, published: true } : a
      )
    );
    toast({
      title: t("planner.assignmentPublished"),
      description: t("planner.assignmentPublishedMsg"),
    });
  };

  return {
    assignments: filteredAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignments,
    publishAssignment
  };
};
