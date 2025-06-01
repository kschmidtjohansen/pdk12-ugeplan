
import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Assignment } from '../types/assignment';
import { usePlannerAssignments } from './usePlannerAssignments';
import { 
  getWeekDates, 
  getCurrentWeekInfo, 
  getPreviousWeekInfo, 
  getNextWeekInfo
} from '@/utils/dates';
import { useAssignmentFilters } from '@/hooks/useAssignmentFilters';
import { getUnpublishedAssignment } from '@/hooks/useAssignmentPublishing';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';

export const usePlannerPage = () => {
  // Get current week info (week number and year)
  const currentWeekInfo = getCurrentWeekInfo();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // State to track the selected week number and year
  const [selectedWeek, setSelectedWeek] = useState(currentWeekInfo.week);
  const [selectedYear, setSelectedYear] = useState(currentWeekInfo.year);
  
  const { 
    assignments, 
    createAssignment, 
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate,
    isDialogOpen,
    setIsDialogOpen,
    currentAssignment,
    setCurrentAssignment
  } = usePlannerAssignments();

  const { filterByWeek } = useAssignmentFilters();

  // FIXED: Get the current date - always calculate fresh with proper timezone handling
  const getFreshToday = () => {
    const now = new Date();
    // Ensure we get the local date properly formatted
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Using state for managing form data and selected day
  const [selectedDay, setSelectedDay] = useState<string>(getFreshToday());
  const [formData, setFormData] = useState<Partial<Assignment>>({
    title: '',
    description: '',
    date: getFreshToday(),
    fromTime: '08:00',
    toTime: '16:00',
    location: '',
    car: '',
    employees: []
  });

  // Get the date range for the selected week with ISO week calculation
  const weekDates = getWeekDates(selectedWeek, selectedYear);
  
  // Filter assignments for the current week
  const weekAssignments = filterByWeek(assignments, selectedWeek, selectedYear);

  // Navigate to previous week
  const handlePreviousWeek = useCallback(() => {
    const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
    console.log(`[usePlannerPage] Going to previous week: ${week}, year: ${year}`);
    setSelectedWeek(week);
    setSelectedYear(year);
  }, [selectedWeek, selectedYear]);

  // Navigate to next week
  const handleNextWeek = useCallback(() => {
    const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
    console.log(`[usePlannerPage] Going to next week: ${week}, year: ${year}`);
    setSelectedWeek(week);
    setSelectedYear(year);
  }, [selectedWeek, selectedYear]);

  // Handle assignment creation/editing - always use the current date if no date provided
  const handleOpenCreateDialog = useCallback((date: string) => {
    setCurrentAssignment(null);
    
    // FIXED: Ensure we have a valid date - use provided date or today's date with fresh calculation
    const freshTodayDate = getFreshToday();
    const taskDate = date && date.trim() !== '' ? date : freshTodayDate;
    setSelectedDay(taskDate);
    
    console.log("[usePlannerPage] Creating new assignment with date:", taskDate);
    console.log("[usePlannerPage] Fresh today's date is:", freshTodayDate);
    
    // Set form data in one update to avoid race conditions
    setFormData({
      title: '',
      description: '',
      date: taskDate,
      fromTime: '08:00',
      toTime: '16:00',
      location: '',
      car: '',
      employees: []
    });
    
    setIsDialogOpen(true);
  }, [setCurrentAssignment, setIsDialogOpen]);

  const handleOpenEditDialog = useCallback((assignment: Assignment) => {
    console.log("[usePlannerPage] Opening edit dialog with assignment:", assignment);
    setCurrentAssignment(assignment);
    setSelectedDay(assignment.date);
    
    // Set form data at once to avoid multiple renders
    // Make sure to preserve the car ID and employees properly
    // Fix: Ensure employees array is properly copied, not referenced
    setFormData({
      ...assignment,
      employees: Array.isArray(assignment.employees) ? [...assignment.employees] : []
    });
    
    setIsDialogOpen(true);
  }, [setCurrentAssignment, setIsDialogOpen]);

  // New function to handle copying an assignment
  const handleCopyAssignment = useCallback((assignment: Assignment) => {
    console.log("[usePlannerPage] Copying assignment:", assignment);
    
    // Set the assignment to be copied
    setCurrentAssignment(null);
    
    // Set selected day to the current day (but this will be changed by the user)
    const freshTodayDate = getFreshToday();
    setSelectedDay(freshTodayDate);
    
    // Pre-fill the form with the assignment data but change the date to today
    // and mark as unpublished
    setFormData({
      ...assignment,
      id: undefined,  // Remove the ID to force creation of a new assignment
      date: freshTodayDate,
      published: false,
      employees: Array.isArray(assignment.employees) ? [...assignment.employees] : []
    });
    
    // Show a success toast
    toast({
      title: t('planner.copyAssignment'),
      description: t('planner.selectDateForCopy')
    });
    
    // Open the dialog to let the user select a new date
    setIsDialogOpen(true);
  }, [setCurrentAssignment, setIsDialogOpen, toast, t]);

  const handleSubmit = useCallback((data: Partial<Assignment>) => {
    console.log("[usePlannerPage] Submitting assignment data:", data);
    
    if (currentAssignment) {
      // Set the edited assignment as unpublished
      const unpublishedData = getUnpublishedAssignment(data as Assignment);
      updateAssignment(currentAssignment.id, unpublishedData);
    } else {
      // This handles both new assignments and copied assignments
      createAssignment({
        ...data,
        id: Date.now().toString(),
        published: false
      } as Assignment);
    }
    setIsDialogOpen(false);
  }, [currentAssignment, createAssignment, updateAssignment, setIsDialogOpen]);

  // Fixed wrapper function that uses selectedDay internally
  const handlePublishDay = useCallback(() => {
    if (selectedDay) {
      publishAssignmentsByDate(selectedDay);
    }
  }, [selectedDay, publishAssignmentsByDate]);
  
  return {
    selectedWeek,
    selectedYear,
    weekDates,
    weekAssignments,
    isDialogOpen,
    setIsDialogOpen,
    currentAssignment,
    selectedDay,
    formData,
    setFormData,
    handlePreviousWeek,
    handleNextWeek,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleSubmit,
    handlePublishDay,
    deleteAssignment,
    publishAssignment,
    handleCopyAssignment
  };
};
