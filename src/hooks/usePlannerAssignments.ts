
import { useState } from 'react';
import { useAssignments } from './useAssignments';
import { useAssignmentFilters } from './useAssignmentFilters';
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
    deleteAssignment
  } = useAssignments();
  
  // Get filter functionality
  const filterMethods = useAssignmentFilters();
  
  // Filter assignments
  const filteredAssignments = filterMethods.filterByPermissions(assignments, true); // Default to showing all
  
  // Get publishing functionality
  const { publishAssignment, publishAssignmentsByDate } = useAssignmentPublishing(assignments, updateAssignment);
  
  // Open dialog for creating a new assignment
  const handleCreate = () => {
    setCurrentAssignment(null);
    setIsDialogOpen(true);
  };
  
  // Open dialog for editing an existing assignment
  const handleEdit = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setIsDialogOpen(true);
  };
  
  // Open dialog for confirming assignment deletion
  const handleDeleteConfirm = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setIsDeleteDialogOpen(true);
  };
  
  // Execute the assignment delete action
  const handleDelete = async () => {
    if (currentAssignment) {
      await deleteAssignment(currentAssignment.id);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Group assignments by day for display
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
    publishAssignmentsByDate
  };
};
