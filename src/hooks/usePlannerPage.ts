
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Assignment } from '../types/assignment';
import { usePlannerAssignments } from './usePlannerAssignments';
import { 
  getWeekDates, 
  getCurrentWeekInfo, 
  getPreviousWeekInfo, 
  getNextWeekInfo
} from '@/utils/weekDates';
import { useAssignmentFilters } from '@/hooks/useAssignmentFilters';
import { getUnpublishedAssignment } from '@/hooks/useAssignmentPublishing';

export const usePlannerPage = () => {
  // Get current week info (week number and year)
  const currentWeekInfo = getCurrentWeekInfo();
  
  // State to track the selected week number and year
  const [selectedWeek, setSelectedWeek] = useState(currentWeekInfo.week);
  const [selectedYear, setSelectedYear] = useState(currentWeekInfo.year);
  
  // Log when the selected week/year changes
  useEffect(() => {
    console.log(`FIXED usePlannerPage: Selected week: ${selectedWeek}, year: ${selectedYear}`);
  }, [selectedWeek, selectedYear]);

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

  // Using state for managing form data
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Assignment>>({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    fromTime: '08:00',
    toTime: '16:00',
    location: '',
    car: '',
    employees: []
  });

  // FIXED: Get the date range for the selected week with correct ISO week calculation
  const weekDates = getWeekDates(selectedWeek, selectedYear);
  
  // FIXED: Better log output with more details
  useEffect(() => {
    console.log("FIXED usePlannerPage: Week dates obtained:", {
      weekNumber: selectedWeek,
      year: selectedYear,
      start: weekDates.start.toISOString(),
      end: weekDates.end.toISOString(),
      startDay: format(weekDates.start, 'EEEE'),
      startDayNumber: weekDates.start.getDay(),
      endDay: format(weekDates.end, 'EEEE'),
      endDayNumber: weekDates.end.getDay()
    });
    
    // Validate that we have Monday-Sunday (days 1-0)
    if (weekDates.start.getDay() !== 1 || weekDates.end.getDay() !== 0) {
      console.error("FIXED usePlannerPage ERROR: Week dates are NOT Monday-Sunday!");
    } else {
      console.log("FIXED usePlannerPage: Week dates are correct Monday-Sunday range");
    }
  }, [selectedWeek, selectedYear, weekDates]);
  
  // Filter assignments for the current week
  const weekAssignments = filterByWeek(assignments, selectedWeek, selectedYear);

  // Navigate to previous week
  const handlePreviousWeek = useCallback(() => {
    const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
    console.log(`Going to previous week: ${week}, year: ${year}`);
    setSelectedWeek(week);
    setSelectedYear(year);
  }, [selectedWeek, selectedYear]);

  // Navigate to next week
  const handleNextWeek = useCallback(() => {
    const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
    console.log(`Going to next week: ${week}, year: ${year}`);
    setSelectedWeek(week);
    setSelectedYear(year);
  }, [selectedWeek, selectedYear]);

  // Handle assignment creation/editing
  const handleOpenCreateDialog = useCallback((date: string) => {
    setCurrentAssignment(null);
    setSelectedDay(date);
    
    // Set form data in one update to avoid race conditions
    setFormData({
      title: '',
      description: '',
      date,
      fromTime: '08:00',
      toTime: '16:00',
      location: '',
      car: '',
      employees: []
    });
    
    setIsDialogOpen(true);
  }, [setCurrentAssignment, setIsDialogOpen]);

  const handleOpenEditDialog = useCallback((assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setSelectedDay(assignment.date);
    
    // Set form data at once to avoid multiple renders
    setFormData({...assignment});
    
    setIsDialogOpen(true);
  }, [setCurrentAssignment, setIsDialogOpen]);

  const handleSubmit = useCallback((data: Partial<Assignment>) => {
    if (currentAssignment) {
      // Set the edited assignment as unpublished
      const unpublishedData = getUnpublishedAssignment(data as Assignment);
      updateAssignment(currentAssignment.id, unpublishedData);
    } else {
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
    publishAssignment
  };
};
