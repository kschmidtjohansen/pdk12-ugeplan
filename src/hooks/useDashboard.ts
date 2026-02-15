
import { useState, useMemo } from 'react';
import { useOptimizedAssignments } from './useOptimizedAssignments';
import { getWeekNumber, getYearForDate, getCurrentWeekInfo, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/dates';

export const useDashboard = () => {
  const currentWeekInfo = getCurrentWeekInfo();
  const [selectedWeek, setSelectedWeek] = useState(currentWeekInfo.week);
  const [selectedYear, setSelectedYear] = useState(currentWeekInfo.year);

  // Use 'user' filter for dashboard to get user's assignments
  const { 
    assignments, 
    loading, 
    error, 
    refetch 
  } = useOptimizedAssignments('user');

  // Filter assignments to only show the selected week
  const weekAssignments = useMemo(() => {
    if (!assignments || assignments.length === 0) return [];

    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const assignmentWeek = getWeekNumber(assignmentDate);
      const assignmentYear = getYearForDate(assignmentDate);
      return assignmentWeek === selectedWeek && assignmentYear === selectedYear;
    });
  }, [assignments, selectedWeek, selectedYear]);

  const handlePreviousWeek = () => {
    const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  const handleNextWeek = () => {
    const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  const resetToCurrentWeek = () => {
    const current = getCurrentWeekInfo();
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
