
import { useState, useEffect, useMemo } from 'react';
import { useOptimizedAssignments } from './useOptimizedAssignments';
import { getWeekNumber, getYearForDate, getCurrentWeekInfo, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/dates';

export const useDashboard = () => {
  // Get current week info for proper filtering
  const currentWeekInfo = getCurrentWeekInfo();
  const [selectedWeek, setSelectedWeek] = useState(currentWeekInfo.week);
  const [selectedYear, setSelectedYear] = useState(currentWeekInfo.year);

  console.log('[useDashboard] Current week info:', currentWeekInfo);
  console.log('[useDashboard] Selected week/year:', selectedWeek, selectedYear);

  // Use 'user' filter for dashboard to get user's assignments
  const { 
    assignments, 
    loading, 
    error, 
    refetch 
  } = useOptimizedAssignments('user');

  console.log('[useDashboard] Raw assignments from hook:', assignments.length);

  // Filter assignments to only show the selected week
  const weekAssignments = useMemo(() => {
    if (!assignments || assignments.length === 0) {
      console.log('[useDashboard] No assignments to filter');
      return [];
    }

    const filtered = assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const assignmentWeek = getWeekNumber(assignmentDate);
      const assignmentYear = getYearForDate(assignmentDate);
      
      const isInSelectedWeek = assignmentWeek === selectedWeek && assignmentYear === selectedYear;
      
      if (isInSelectedWeek) {
        console.log('[useDashboard] Assignment in week:', {
          assignment: assignment.title,
          date: assignment.date,
          week: assignmentWeek,
          year: assignmentYear,
          employees: assignment.employees
        });
      }
      
      return isInSelectedWeek;
    });

    console.log('[useDashboard] Filtered to week', selectedWeek, ':', filtered.length, 'assignments');
    return filtered;
  }, [assignments, selectedWeek, selectedYear]);

  // Navigate to previous week
  const handlePreviousWeek = () => {
    const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
    console.log('[useDashboard] Previous week:', week, year);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  // Navigate to next week
  const handleNextWeek = () => {
    const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
    console.log('[useDashboard] Next week:', week, year);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  // Reset to current week
  const resetToCurrentWeek = () => {
    const current = getCurrentWeekInfo();
    console.log('[useDashboard] Reset to current week:', current);
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
