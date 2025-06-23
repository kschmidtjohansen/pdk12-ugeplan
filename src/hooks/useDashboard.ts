
import { useState, useEffect, useMemo } from 'react';
import { useOptimizedAssignments } from './useOptimizedAssignments';
import { getWeekNumber, getYearForDate, getCurrentWeekInfo, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/dates';
import { Assignment } from '@/types/assignment';

export const useDashboard = () => {
  // Get current week info for proper filtering
  const currentWeekInfo = getCurrentWeekInfo();
  const [selectedWeek, setSelectedWeek] = useState(currentWeekInfo.week);
  const [selectedYear, setSelectedYear] = useState(currentWeekInfo.year);

  console.log('[useDashboard] FIXED - Current week info:', currentWeekInfo);
  console.log('[useDashboard] FIXED - Selected week/year:', selectedWeek, selectedYear);

  // FIXED: Use 'user' filter for dashboard to get user's assignments with proper filtering
  const { 
    assignments, 
    loading, 
    error, 
    refetch 
  } = useOptimizedAssignments('user');

  console.log('[useDashboard] FIXED - Raw assignments from hook:', assignments.length);

  // FIXED: Filter assignments to only show the selected week with proper ISO week calculation
  const weekAssignments = useMemo(() => {
    const filtered = assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const assignmentWeek = getWeekNumber(assignmentDate);
      const assignmentYear = getYearForDate(assignmentDate);
      
      const isInSelectedWeek = assignmentWeek === selectedWeek && assignmentYear === selectedYear;
      
      if (isInSelectedWeek) {
        console.log('[useDashboard] FIXED - Assignment in week:', {
          assignment: assignment.title,
          date: assignment.date,
          week: assignmentWeek,
          year: assignmentYear,
          employees: assignment.employees
        });
      }
      
      return isInSelectedWeek;
    });

    console.log('[useDashboard] FIXED - Filtered to week', selectedWeek, ':', filtered.length, 'assignments');
    return filtered;
  }, [assignments, selectedWeek, selectedYear]);

  // Navigate to previous week with proper ISO week calculation
  const handlePreviousWeek = () => {
    const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
    console.log('[useDashboard] FIXED - Previous week:', week, year);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  // Navigate to next week with proper ISO week calculation
  const handleNextWeek = () => {
    const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
    console.log('[useDashboard] FIXED - Next week:', week, year);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  // Reset to current week
  const resetToCurrentWeek = () => {
    const current = getCurrentWeekInfo();
    console.log('[useDashboard] FIXED - Reset to current week:', current);
    setSelectedWeek(current.week);
    setSelectedYear(current.year);
  };

  return {
    assignments: weekAssignments,
    allAssignments: assignments,
    loading,
    error,
    selectedWeek,
    selectedYear,
    handlePreviousWeek,
    handleNextWeek,
    resetToCurrentWeek,
    refetch
  };
};
