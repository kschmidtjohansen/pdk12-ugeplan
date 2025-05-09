
import { useState, useEffect } from 'react';
import { useAssignments } from './useAssignments';
import { useAssignmentPublishing } from './useAssignmentPublishing';
import { useAssignmentFilters } from './useAssignmentFilters';
import { getWeekDates } from '@/utils/dateUtils';
import { Assignment } from '@/types/assignment';

// Main hook combining all assignment-related functionality
export const usePlannerAssignments = (selectedWeek?: number) => {
  const { 
    assignments: allAssignments,
    isLoading,
    createAssignment, 
    updateAssignment, 
    deleteAssignment,
    fetchAssignments
  } = useAssignments();
  
  // Function to update assignments array that we pass to the publishing hook
  const updateAssignments = async (updatedAssignments: Assignment[]) => {
    // Map through each assignment and update it individually to preserve proper state updates
    for (const updated of updatedAssignments) {
      await updateAssignment(updated);
    }
  };
  
  // Pass the update function to the publishing hook
  const { 
    publishAssignments, 
    publishAssignment, 
    publishAssignmentsByDate 
  } = useAssignmentPublishing(
    allAssignments,
    updateAssignments
  );
  
  const { filterByWeek } = useAssignmentFilters();
  
  // Filter assignments by the selected week
  const filteredAssignments = selectedWeek 
    ? filterByWeek(allAssignments, selectedWeek)
    : allAssignments;

  return {
    assignments: filteredAssignments,
    isLoading,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignments,
    publishAssignment,
    publishAssignmentsByDate,
    getWeekDates,
    fetchAssignments
  };
};
