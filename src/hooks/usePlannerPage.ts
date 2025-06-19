
import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Assignment } from '../types/assignment';
import { useOptimizedAssignments } from './useOptimizedAssignments';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // FIXED: Use 'all' filter to show ALL assignments to all users, including servicemedarbejder
  const { 
    assignments, 
    loading,
    error,
    operationStates,
    createAssignment, 
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate
  } = useOptimizedAssignments({ filter: 'all' });

  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const { filterByWeek } = useAssignmentFilters();

  // FIXED: Always get a fresh today's date
  const getFreshToday = useCallback(() => {
    const now = new Date();
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

  // Handle assignment creation
  const handleOpenCreateDialog = useCallback((date: string) => {
    console.log('[usePlannerPage] Opening CREATE dialog for date:', date);
    
    setCurrentAssignment(null);
    
    const freshTodayDate = getFreshToday();
    const taskDate = date && date.trim() !== '' ? date : freshTodayDate;
    setSelectedDay(taskDate);
    
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
    setIsDialogOpen(true);
  }, [getFreshToday]);

  // Handle assignment editing
  const handleOpenEditDialog = useCallback((assignment: Assignment) => {
    console.log('[usePlannerPage] Opening EDIT dialog for assignment:', assignment.id);
    
    setCurrentAssignment(assignment);
    setSelectedDay(assignment.date);
    
    const editFormData = {
      ...assignment,
      employees: Array.isArray(assignment.employees) ? [...assignment.employees] : [],
      car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : ''
    };
    
    console.log('[usePlannerPage] Setting form data for edit:', editFormData);
    setFormData(editFormData);
    setIsDialogOpen(true);
  }, []);

  // Handle copying an assignment
  const handleCopyAssignment = useCallback((assignment: Assignment) => {
    console.log('[usePlannerPage] Opening COPY dialog for assignment:', assignment.id);
    
    setCurrentAssignment(null);
    
    const freshTodayDate = getFreshToday();
    setSelectedDay(freshTodayDate);
    
    const copyFormData = {
      ...assignment,
      id: undefined,
      date: freshTodayDate,
      published: false,
      employees: Array.isArray(assignment.employees) ? [...assignment.employees] : [],
      car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : ''
    };
    
    console.log('[usePlannerPage] Setting form data for COPY:', copyFormData);
    setFormData(copyFormData);
    
    toast({
      title: t('planner.copyAssignment'),
      description: t('planner.selectDateForCopy')
    });
    
    setIsDialogOpen(true);
  }, [toast, t, getFreshToday]);

  // Handle form submission with proper optimistic updates
  const handleSubmit = useCallback(async (data: Partial<Assignment>) => {
    try {
      console.log('[usePlannerPage] Submitting form with data:', data);
      
      if (currentAssignment) {
        // Editing existing assignment
        console.log('[usePlannerPage] EDITING assignment:', currentAssignment.id);
        await updateAssignment(currentAssignment.id, data);
      } else {
        // Creating new assignment
        console.log('[usePlannerPage] CREATING new assignment');
        await createAssignment(data);
      }
      
      console.log('[usePlannerPage] Closing dialog after submission');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('[usePlannerPage] Error in handleSubmit:', error);
    }
  }, [currentAssignment, createAssignment, updateAssignment]);

  // Publish day function
  const handlePublishDay = useCallback((date: string) => {
    console.log('[usePlannerPage] Publishing day:', date);
    publishAssignmentsByDate(date);
  }, [publishAssignmentsByDate]);

  // Publish all unpublished assignments
  const handlePublishAllUnpublished = useCallback(() => {
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
    assignments,
    loading,
    error,
    operationStates,
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
