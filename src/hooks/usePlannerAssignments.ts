
import { useState, useCallback } from 'react';
import { useAssignments } from './useAssignments';
import { useAssignmentFilters } from './useAssignmentFilters';
import { Assignment } from '@/types/assignment';
import { useAssignmentPublishing } from './useAssignmentPublishing';
import { groupAssignmentsByDay } from '@/utils/dateUtils';
import { useAuth } from '@/context/AuthContext';

export const usePlannerAssignments = () => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const { user } = useAuth();
  
  // Get assignments data and actions
  const {
    assignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment
  } = useAssignments();
  
  // Get filter functionality
  const filterMethods = useAssignmentFilters();
  
  // Add the missing filterByPermissions function to our local scope
  const filterByPermissions = useCallback((assignments: Assignment[], canManage: boolean) => {
    if (canManage || user?.role === 'administrator' || user?.role === 'skadeleder') {
      // Admins and managers can see all assignments
      return assignments;
    } else {
      // Regular users only see published assignments assigned to them
      return assignments.filter(assignment => 
        assignment.published === true &&
        assignment.employees && 
        assignment.employees.includes(user?.name || '')
      );
    }
  }, [user]);
  
  // Filter assignments - use our local filterByPermissions function
  const filteredAssignments = filterByPermissions(assignments, true); // Default to showing all
  
  // Get publishing functionality - adapt updateAssignment to match expected signature
  const assignmentUpdater = useCallback((assignment: Assignment) => {
    return updateAssignment(assignment.id, assignment);
  }, [updateAssignment]);
  
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
    publishAssignment,
    publishAssignmentsByDate,
    // Include the filterByPermissions function so it can be used elsewhere
    filterByPermissions
  };
};
