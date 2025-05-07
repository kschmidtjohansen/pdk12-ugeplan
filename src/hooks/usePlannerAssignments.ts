
import { useState } from 'react';
import { useAssignments } from './useAssignments';
import { useAssignmentPublishing } from './useAssignmentPublishing';
import { useAssignmentFilters } from './useAssignmentFilters';
import { getWeekDates } from '@/utils/dateUtils';

// Main hook combining all assignment-related functionality
export const usePlannerAssignments = (selectedWeek?: number) => {
  const { assignments, createAssignment, updateAssignment, deleteAssignment } = useAssignments();
  const { publishAssignments, publishAssignment, publishAssignmentsByDate } = useAssignmentPublishing(
    assignments, 
    // Pass setAssignments from useAssignments
    // This is a workaround since we need access to state setter from another hook
    (newAssignments) => useAssignments().assignments
  );
  const { filterByWeek } = useAssignmentFilters();
  
  // Filter assignments by the selected week
  const filteredAssignments = selectedWeek 
    ? filterByWeek(assignments, selectedWeek)
    : assignments;

  // Re-export the week dates calculation utility
  const getWeekDatesUtil = getWeekDates;

  return {
    assignments: filteredAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignments,
    publishAssignment,
    publishAssignmentsByDate,
    getWeekDates: getWeekDatesUtil
  };
};
