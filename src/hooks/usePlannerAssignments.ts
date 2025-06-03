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
  
  // ENHANCED DEBUGGING: Track data flow through hooks
  console.log("[usePlannerAssignments] === DATA FLOW DEBUGGING ===");
  console.log("[usePlannerAssignments] Raw assignments from useAssignments:", assignments.length);
  console.log("[usePlannerAssignments] Raw assignments details:", assignments.map(a => ({
    id: a.id,
    location: a.location,
    published: a.published,
    employees: a.employees,
    employeeCount: a.employees?.length || 0,
    employeesType: typeof a.employees,
    isEmployeesArray: Array.isArray(a.employees)
  })));
  
  // Log each assignment's employee data in detail
  assignments.forEach((assignment, index) => {
    console.log(`[usePlannerAssignments] Assignment ${index + 1} (${assignment.location}) employee details:`);
    console.log(`  - Employees:`, assignment.employees);
    console.log(`  - Type:`, typeof assignment.employees);
    console.log(`  - Is Array:`, Array.isArray(assignment.employees));
    console.log(`  - Length:`, assignment.employees?.length || 0);
    if (Array.isArray(assignment.employees)) {
      assignment.employees.forEach((emp, empIndex) => {
        console.log(`    - Employee ${empIndex}: "${emp}" (type: ${typeof emp})`);
      });
    }
  });
  
  const filteredAssignments = filterForPlanner(assignments, true);
  
  console.log("[usePlannerAssignments] === AFTER FILTERING ===");
  console.log("[usePlannerAssignments] Filtered assignments for planner:", filteredAssignments.length);
  console.log("[usePlannerAssignments] Filtered assignments details:", filteredAssignments.map(a => ({
    id: a.id,
    location: a.location,
    published: a.published,
    employees: a.employees,
    employeeCount: a.employees?.length || 0,
    employeesType: typeof a.employees,
    isEmployeesArray: Array.isArray(a.employees)
  })));
  
  // Log each filtered assignment's employee data in detail
  filteredAssignments.forEach((assignment, index) => {
    console.log(`[usePlannerAssignments] Filtered Assignment ${index + 1} (${assignment.location}) employee details:`);
    console.log(`  - Employees:`, assignment.employees);
    console.log(`  - Type:`, typeof assignment.employees);
    console.log(`  - Is Array:`, Array.isArray(assignment.employees));
    console.log(`  - Length:`, assignment.employees?.length || 0);
    if (Array.isArray(assignment.employees)) {
      assignment.employees.forEach((emp, empIndex) => {
        console.log(`    - Employee ${empIndex}: "${emp}" (type: ${typeof emp})`);
      });
    }
  });
  
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
  
  console.log("[usePlannerAssignments] === FINAL GROUPED ASSIGNMENTS ===");
  console.log("[usePlannerAssignments] Final grouped assignments:", Object.keys(groupedAssignments).length, "days");
  console.log("[usePlannerAssignments] Grouped assignments summary:", Object.entries(groupedAssignments).map(([date, assignments]) => ({
    date,
    count: Array.isArray(assignments) ? assignments.length : 0,
    assignments: Array.isArray(assignments) ? assignments.map(a => ({
      id: a.id,
      location: a.location,
      employees: a.employees,
      employeeCount: a.employees?.length || 0
    })) : []
  })));
  
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
