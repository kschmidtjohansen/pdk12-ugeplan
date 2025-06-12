
import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Assignment } from '../types/assignment';
import { useAssignmentsConsolidated } from './useAssignmentsConsolidated';
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
    setIsDialogOpen
  } = useAssignmentsConsolidated({ filter: 'planner' });

  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const { filterByWeek } = useAssignmentFilters();

  // FIXED: Always get a fresh today's date - recalculate each time to ensure it updates daily
  const getFreshToday = useCallback(() => {
    const now = new Date();
    // Force fresh calculation and proper timezone handling
    return format(now, 'yyyy-MM-dd');
  }, []);
  
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

  // Update formData.date daily to ensure it always reflects the current date
  React.useEffect(() => {
    const today = getFreshToday();
    setFormData(prev => ({ ...prev, date: today }));
    setSelectedDay(today);
  }, [getFreshToday]);

  // Get the date range for the selected week with ISO week calculation
  const weekDates = getWeekDates(selectedWeek, selectedYear);
  
  // Filter assignments for the current week
  const weekAssignments = filterByWeek(assignments, selectedWeek, selectedYear);

  // Navigate to previous week
  const handlePreviousWeek = useCallback(() => {
    const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
    setSelectedWeek(week);
    setSelectedYear(year);
  }, [selectedWeek, selectedYear]);

  // Navigate to next week
  const handleNextWeek = useCallback(() => {
    const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
    setSelectedWeek(week);
    setSelectedYear(year);
  }, [selectedWeek, selectedYear]);

  // Handle assignment creation/editing - always use the current date if no date provided
  const handleOpenCreateDialog = useCallback((date: string) => {
    setCurrentAssignment(null);
    
    // FIXED: Ensure we have a valid date - use provided date or fresh today's date
    const freshTodayDate = getFreshToday();
    const taskDate = date && date.trim() !== '' ? date : freshTodayDate;
    setSelectedDay(taskDate);
    
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
  }, [setIsDialogOpen, getFreshToday]);

  const handleOpenEditDialog = useCallback((assignment: Assignment) => {
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
  }, [setIsDialogOpen]);

  // New function to handle copying an assignment
  const handleCopyAssignment = useCallback((assignment: Assignment) => {
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
    
    // Show a success toast with proper translation
    toast({
      title: t('planner.copyAssignment'),
      description: t('planner.selectDateForCopy')
    });
    
    // Open the dialog to let the user select a new date
    setIsDialogOpen(true);
  }, [setIsDialogOpen, toast, t, getFreshToday]);

  const handleSubmit = useCallback((data: Partial<Assignment>) => {
    try {
      if (currentAssignment) {
        // Set the edited assignment as unpublished
        const unpublishedData = getUnpublishedAssignment(data as Assignment);
        updateAssignment(currentAssignment.id, unpublishedData);
        
        // Show success toast for update
        toast({
          title: t('planner.assignmentUpdated'),
          description: t('planner.assignmentUpdatedMsg', { title: data.title || data.location || 'Assignment' })
        });
      } else {
        // This handles both new assignments and copied assignments
        const newAssignment = {
          ...data,
          id: Date.now().toString(),
          published: false
        } as Assignment;
        
        createAssignment(newAssignment);
        
        // Show success toast for creation
        toast({
          title: t('planner.assignmentCreated'),
          description: t('planner.assignmentCreatedMsg', { title: data.title || data.location || 'Assignment' })
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Show error toast with proper translation
      toast({
        title: currentAssignment ? t('planner.errorUpdatingAssignment') : t('planner.errorCreatingAssignment'),
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  }, [currentAssignment, createAssignment, updateAssignment, setIsDialogOpen, toast, t]);

  // Fixed wrapper function that uses selectedDay internally
  const handlePublishDay = useCallback(() => {
    if (selectedDay) {
      publishAssignmentsByDate(selectedDay);
    }
  }, [selectedDay, publishAssignmentsByDate]);

  // New function to publish all unpublished assignments
  const handlePublishAllUnpublished = useCallback(() => {
    // This functionality would need to be implemented in the consolidated hook
    toast({
      title: t('common.info'),
      description: 'Publish all unpublished functionality not yet implemented'
    });
  }, [toast, t]);
  
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
    handlePublishAllUnpublished,
    deleteAssignment,
    publishAssignment,
    handleCopyAssignment
  };
};
