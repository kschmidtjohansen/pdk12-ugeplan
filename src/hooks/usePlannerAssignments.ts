
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { startOfWeek, endOfWeek, addDays, isWithinInterval, parseISO, format, addWeeks } from 'date-fns';
import { da } from 'date-fns/locale';

// Fixed mock data with updated dates to match current year
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
  // New mock assignments for today's dashboard
  {
    id: '6',
    title: 'Akut vandskade',
    description: 'Hurtig inspektion af vandskade i lejlighed.',
    date: '2025-05-07', // Today (for testing)
    fromTime: '08:00',
    toTime: '10:00',
    location: 'Vejle Centrum',
    car: 'Van 3',
    employees: ['John Doe'],
    published: true
  },
  {
    id: '7',
    title: 'Fugtmåling',
    description: 'Standard fugtmåling efter tidligere vandskade.',
    date: '2025-05-07', // Today (for testing)
    fromTime: '11:00',
    toTime: '12:30',
    location: 'Kolding Nord',
    car: 'Van 1',
    employees: ['John Doe'],
    published: true
  },
];

// Fixed week dates calculation using date-fns
export const getWeekDates = (weekNumber: number, year: number = new Date().getFullYear()) => {
  // Create a date for January 1st of the given year
  const firstDayOfYear = new Date(year, 0, 1);
  
  // Find the first day of the first week (which contains January 4th per ISO standard)
  const firstWeekStart = startOfWeek(new Date(year, 0, 4), { weekStartsOn: 1 });
  
  // Calculate the start of our target week by adding (weekNumber - 1) weeks to the first week
  const targetWeekStart = addWeeks(firstWeekStart, weekNumber - 1);
  
  // The end of the week is 6 days after the start (start of week is Monday, end is Sunday)
  const targetWeekEnd = addDays(targetWeekStart, 6);
  
  return { start: targetWeekStart, end: targetWeekEnd };
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

  const publishAssignmentsByDate = (date: string) => {
    const updatedAssignments = assignments.map(a => 
      a.date === date ? { ...a, published: true } : a
    );
    
    setAssignments(updatedAssignments);
    toast({
      title: t("planner.assignmentsPublished"),
      description: t("planner.assignmentsPublishedMsg"),
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
    publishAssignment,
    publishAssignmentsByDate
  };
};
