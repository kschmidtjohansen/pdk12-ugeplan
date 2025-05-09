
import { useState } from 'react';
import { useAssignments } from './useAssignments';
import { useAssignmentPublishing } from './useAssignmentPublishing';
import { useAssignmentFilters } from './useAssignmentFilters';
import { getWeekDates } from '@/utils/weekDates';
import { Assignment } from '@/types/assignment';

// Main hook combining all assignment-related functionality
export const usePlannerAssignments = (selectedWeek?: number) => {
  const { 
    assignments: allAssignments, 
    createAssignment, 
    updateAssignment, 
    deleteAssignment 
  } = useAssignments();
  
  // Function to update assignments array that we pass to the publishing hook
  const updateAssignments = (updatedAssignments: Assignment[]) => {
    // Map through each assignment and update it individually to preserve proper state updates
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
  
  // Get filtered assignments for the selected week
  let filteredAssignments = allAssignments;
  
  if (selectedWeek !== undefined) {
    const { start, end } = getWeekDates(selectedWeek);
    filteredAssignments = allAssignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      return assignmentDate >= start && assignmentDate <= end;
    });
  }

  return {
    assignments: filteredAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignments,
    publishAssignment,
    publishAssignmentsByDate
  };
};
