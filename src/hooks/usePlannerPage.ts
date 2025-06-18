
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
    console.log('[usePlannerPage] ===== OPENING CREATE DIALOG =====');
    console.log('[usePlannerPage] Opening CREATE dialog for date:', date);
    
    setCurrentAssignment(null);
    
    // FIXED: Ensure we have a valid date - use provided date or fresh today's date
    const freshTodayDate = getFreshToday();
    const taskDate = date && date.trim() !== '' ? date : freshTodayDate;
    setSelectedDay(taskDate);
    
    // Set form data in one update to avoid race conditions
    const newFormData = {
      title: '',
      description: '',
      date: taskDate,
      fromTime: '08:00',
      toTime: '16:00',
      location: '',
      car: '',
      employees: []
    };
    
    console.log('[usePlannerPage] Setting form data for CREATE:', newFormData);
    setFormData(newFormData);
    
    console.log('[usePlannerPage] Setting dialog open to true for CREATE');
    setIsDialogOpen(true);
  }, [setIsDialogOpen, getFreshToday]);

  // FIXED: Properly handle edit dialog opening with enhanced debugging
  const handleOpenEditDialog = useCallback((assignment: Assignment) => {
    console.log('[usePlannerPage] ===== EDIT DIALOG OPENING =====');
    console.log('[usePlannerPage] Assignment received:', assignment);
    console.log('[usePlannerPage] Assignment ID:', assignment.id);
    console.log('[usePlannerPage] Assignment title:', assignment.title);
    console.log('[usePlannerPage] Assignment published status:', assignment.published);
    console.log('[usePlannerPage] Assignment employees:', assignment.employees);
    console.log('[usePlannerPage] Assignment car:', assignment.car);
    
    setCurrentAssignment(assignment);
    setSelectedDay(assignment.date);
    
    // Set form data at once to avoid multiple renders
    // Make sure to preserve the employees and car data properly
    const editFormData = {
      ...assignment,
      employees: Array.isArray(assignment.employees) ? [...assignment.employees] : [],
      car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : ''
    };
    
    console.log('[usePlannerPage] Setting form data for edit:', editFormData);
    setFormData(editFormData);
    
    console.log('[usePlannerPage] Setting dialog open to true for EDIT');
    setIsDialogOpen(true);
    
    console.log('[usePlannerPage] Current dialog state should be true:', true);
  }, [setIsDialogOpen]);

  // New function to handle copying an assignment
  const handleCopyAssignment = useCallback((assignment: Assignment) => {
    console.log('[usePlannerPage] ===== OPENING COPY DIALOG =====');
    console.log('[usePlannerPage] Opening COPY dialog for assignment:', assignment.id);
    
    // Set the assignment to be copied
    setCurrentAssignment(null);
    
    // Set selected day to the current day (but this will be changed by the user)
    const freshTodayDate = getFreshToday();
    setSelectedDay(freshTodayDate);
    
    // Pre-fill the form with the assignment data but change the date to today
    // and mark as unpublished
    const copyFormData = {
      ...assignment,
      id: undefined,  // Remove the ID to force creation of a new assignment
      date: freshTodayDate,
      published: false,
      employees: Array.isArray(assignment.employees) ? [...assignment.employees] : [],
      car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : ''
    };
    
    console.log('[usePlannerPage] Setting form data for COPY:', copyFormData);
    setFormData(copyFormData);
    
    // Show a success toast with proper translation
    toast({
      title: t('planner.copyAssignment'),
      description: t('planner.selectDateForCopy')
    });
    
    // Open the dialog to let the user select a new date
    setIsDialogOpen(true);
  }, [setIsDialogOpen, toast, t, getFreshToday]);

  // FIXED: Handle form submission with proper unpublishing for edits and enhanced debugging
  const handleSubmit = useCallback((data: Partial<Assignment>) => {
    try {
      console.log('[usePlannerPage] ===== FORM SUBMISSION =====');
      console.log('[usePlannerPage] Submitting form with data:', data);
      console.log('[usePlannerPage] Current assignment:', currentAssignment);
      console.log('[usePlannerPage] Form data received:', {
        title: data.title,
        location: data.location,
        date: data.date,
        employees: data.employees,
        car: data.car
      });
      
      if (currentAssignment) {
        // Editing existing assignment - automatically unpublish
        const unpublishedData = {
          ...data,
          published: false // Always unpublish when editing
        };
        console.log('[usePlannerPage] EDITING - Data with unpublished status:', unpublishedData);
        console.log('[usePlannerPage] Original assignment published status:', currentAssignment.published);
        console.log('[usePlannerPage] New assignment will be published:', false);
        
        updateAssignment(currentAssignment.id, unpublishedData);
      } else {
        // This handles both new assignments and copied assignments
        const newAssignment = {
          ...data,
          id: Date.now().toString(),
          published: false
        } as Assignment;
        
        console.log('[usePlannerPage] CREATING new assignment:', newAssignment);
        createAssignment(newAssignment);
      }
      
      console.log('[usePlannerPage] Closing dialog after submission');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('[usePlannerPage] Error in handleSubmit:', error);
    }
  }, [currentAssignment, createAssignment, updateAssignment, setIsDialogOpen]);

  // FIXED: Publish day function that accepts date parameter
  const handlePublishDay = useCallback((date: string) => {
    console.log('[usePlannerPage] Publishing day:', date);
    publishAssignmentsByDate(date);
  }, [publishAssignmentsByDate]);

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
