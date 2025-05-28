
import { useState, useCallback } from 'react';
import { useAssignments } from './useAssignments';
import { useViewSpecificFilters } from './useViewSpecificFilters';
import { Assignment } from '@/types/assignment';
import { useAssignmentPublishing } from './useAssignmentPublishing';
import { groupAssignmentsByDay } from '@/utils/dateUtils';

export const usePlannerAssignments = () => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  
  // Get assignments data and actions
  const {
    assignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    fetchAssignments
  } = useAssignments();
  
  // Get filter functionality - using the planner-specific filter
  const { filterForPlanner } = useViewSpecificFilters();
  
  // Filter assignments for planner view (servicemedarbejdere see all published assignments)
  const filteredAssignments = filterForPlanner(assignments, true);
  
  // Get publishing functionality - adapt updateAssignment to match expected signature
  const assignmentUpdater = useCallback(async (assignment: Assignment) => {
    await updateAssignment(assignment.id, assignment);
    // Trigger a data refresh after updating
    await fetchAssignments();
    return true;
  }, [updateAssignment, fetchAssignments]);
  
  const { publishAssignment, publishAssignmentsByDate } = useAssignmentPublishing(assignments, assignmentUpdater);
  
  // Open dialog for creating a new assignment - use useCallback to prevent unnecessary re-renders
  const handleCreate = useCallback(() => {
    setCurrentAssignment(null);
    setIsDialogOpen(true);
  }, []);
  
  // Open dialog for editing an existing assignment - use useCallback to prevent unnecessary re-renders
  const handleEdit = useCallback((assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setIsDialogOpen(true);
  }, []);
  
  // Open dialog for confirming assignment deletion - use useCallback to prevent unnecessary re-renders
  const handleDeleteConfirm = useCallback((assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setIsDeleteDialogOpen(true);
  }, []);
  
  // Execute the assignment delete action - use useCallback to prevent unnecessary re-renders
  const handleDelete = useCallback(async () => {
    if (currentAssignment) {
      await deleteAssignment(currentAssignment.id);
      setIsDeleteDialogOpen(false);
    }
  }, [currentAssignment, deleteAssignment]);
  
  // Enhanced publish assignment function that refreshes data
  const publishAssignmentWithRefresh = useCallback(async (assignmentId: string) => {
    const result = await publishAssignment(assignmentId);
    if (result) {
      // Refresh the assignments data after successful publishing
      await fetchAssignments();
    }
    return result;
  }, [publishAssignment, fetchAssignments]);

  // Enhanced publish assignments by date function that refreshes data
  const publishAssignmentsByDateWithRefresh = useCallback(async (date: string) => {
    const result = await publishAssignmentsByDate(date);
    if (result) {
      // Refresh the assignments data after successful publishing
      await fetchAssignments();
    }
    return result;
  }, [publishAssignmentsByDate, fetchAssignments]);
  
  // Group assignments by day for display - memoize calculation to avoid unnecessary re-calculations
  const groupedAssignments = groupAssignmentsByDay(filteredAssignments);
  
  return {
    assignments: filteredAssignments,
    groupedAssignments,
    loading,
    error,
    isDialogOpen,
    setIsDialogOpen,
    currentAssignment,
    setCurrentAssignment,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleCreate,
    handleEdit,
    handleDelete,
    handleDeleteConfirm,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment: publishAssignmentWithRefresh,
    publishAssignmentsByDate: publishAssignmentsByDateWithRefresh
  };
};
