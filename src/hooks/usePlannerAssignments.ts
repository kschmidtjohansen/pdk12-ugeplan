
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
    createAssignment, 
    updateAssignment, 
    deleteAssignment,
    isLoading
  } = useAssignments();
  
  // Function to update assignments array that we pass to the publishing hook
  const updateAssignments = (updatedAssignments: Assignment[]) => {
    // Map through each assignment and update it individually
    updatedAssignments.forEach(updated => {
      updateAssignment(updated);
    });
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
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignments,
    publishAssignment,
    publishAssignmentsByDate,
    getWeekDates,
    isLoading
  };
};
