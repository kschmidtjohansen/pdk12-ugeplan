
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
  const { 
    filters,
    filteredAssignments,
    handleFilterChange
  } = useAssignmentFilters(assignments);
  
  // Get publishing functionality
  const { publishAssignment } = useAssignmentPublishing(updateAssignment);
  
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
    filters,
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
    handleFilterChange,
    createAssignment,
    updateAssignment,
    publishAssignment
  };
};
