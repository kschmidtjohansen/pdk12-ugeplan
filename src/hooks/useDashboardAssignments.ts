
import { useState, useEffect, useCallback } from 'react';
import { useAssignmentData } from './assignment/useAssignmentData';
import { useViewSpecificFilters } from './useViewSpecificFilters';
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';

export const useDashboardAssignments = () => {
  const { user } = useAuth();
  const { 
    assignments, 
    loading, 
    error, 
    fetchAssignments 
  } = useAssignmentData();
  
  const { filterForDashboard } = useViewSpecificFilters();
  
  // Force refresh when user or role changes
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    if (user?.id) {
      console.log(`[useDashboardAssignments] User changed to: ${user.name} (${user.role}), forcing refresh`);
      setRefreshTrigger(prev => prev + 1);
      fetchAssignments();
    }
  }, [user?.id, user?.role, fetchAssignments]);
  
  // Apply dashboard-specific filtering with comprehensive logging
  const dashboardAssignments = filterForDashboard(assignments);
  
  console.log(`[useDashboardAssignments] Final dashboard data for ${user?.name} (${user?.role}):`);
  console.log(`[useDashboardAssignments] - Raw assignments: ${assignments.length}`);
  console.log(`[useDashboardAssignments] - Filtered assignments: ${dashboardAssignments.length}`);
  console.log(`[useDashboardAssignments] - Assignment details:`, dashboardAssignments.map(a => ({
    id: a.id,
    location: a.location,
    date: a.date,
    published: a.published,
    employees: a.employees,
    employeeCount: a.employees?.length || 0
  })));

  // Filter assignments for a specific week
  const getAssignmentsForWeek = useCallback((startDate: string, endDate: string) => {
    console.log(`[useDashboardAssignments] getAssignmentsForWeek called for ${user?.name} (${user?.role})`);
    console.log(`[useDashboardAssignments] Date range: ${startDate} to ${endDate}`);
    console.log(`[useDashboardAssignments] Available dashboard assignments:`, dashboardAssignments.map(a => ({
      id: a.id,
      location: a.location,
      date: a.date,
      employees: a.employees
    })));
    
    const weekAssignments = dashboardAssignments.filter(assignment => {
      const assignmentDate = assignment.date;
      const isInWeek = assignmentDate >= startDate && assignmentDate <= endDate;
      
      console.log(`[useDashboardAssignments] Assignment ${assignment.id} (${assignment.location}):`, {
        date: assignmentDate,
        weekStart: startDate,
        weekEnd: endDate,
        isInWeek: isInWeek,
        employees: assignment.employees,
        published: assignment.published
      });
      
      return isInWeek;
    }).sort((a, b) => {
      // Sort by date first (earliest first)
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      // If same date, sort by fromTime (earliest first)
      return a.fromTime.localeCompare(b.fromTime);
    });

    console.log(`[useDashboardAssignments] Final week assignments for ${user?.name}:`, weekAssignments.map(a => ({
      id: a.id,
      location: a.location,
      employees: a.employees,
      date: a.date,
      employeeCount: a.employees?.length || 0
    })));

    return weekAssignments;
  }, [dashboardAssignments, user?.name, user?.role]);

  // Force refresh function for debugging
  const forceRefresh = useCallback(() => {
    console.log(`[useDashboardAssignments] Force refresh triggered for ${user?.name} (${user?.role})`);
    setRefreshTrigger(prev => prev + 1);
    fetchAssignments();
  }, [fetchAssignments, user?.name, user?.role]);

  return {
    assignments: dashboardAssignments,
    loading,
    error,
    fetchAssignments,
    getAssignmentsForWeek,
    forceRefresh
  };
};
