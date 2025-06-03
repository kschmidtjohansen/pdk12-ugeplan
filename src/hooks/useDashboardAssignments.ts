
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
      console.log(`[useDashboardAssignments] ===== USER CHANGE DETECTED =====`);
      console.log(`[useDashboardAssignments] User changed to: ${user.name} (${user.role}) - ID: ${user.id}`);
      setRefreshTrigger(prev => prev + 1);
      fetchAssignments();
    }
  }, [user?.id, user?.role, fetchAssignments]);
  
  // Apply dashboard-specific filtering with comprehensive logging
  const dashboardAssignments = filterForDashboard(assignments);
  
  console.log(`[useDashboardAssignments] ===== FINAL DASHBOARD SUMMARY =====`);
  console.log(`[useDashboardAssignments] User: ${user?.name} (${user?.role})`);
  console.log(`[useDashboardAssignments] Raw assignments from useAssignmentData: ${assignments.length}`);
  console.log(`[useDashboardAssignments] Filtered dashboard assignments: ${dashboardAssignments.length}`);
  
  // Detailed logging of each assignment
  dashboardAssignments.forEach(assignment => {
    console.log(`[useDashboardAssignments] Dashboard assignment "${assignment.location}" (${assignment.id}):`, {
      date: assignment.date,
      published: assignment.published,
      employees: assignment.employees,
      employeeCount: assignment.employees?.length || 0,
      employeeList: assignment.employees?.join(', ') || 'None'
    });
  });

  // Filter assignments for a specific week
  const getAssignmentsForWeek = useCallback((startDate: string, endDate: string) => {
    console.log(`[useDashboardAssignments] ===== GET WEEK ASSIGNMENTS =====`);
    console.log(`[useDashboardAssignments] User: ${user?.name} (${user?.role})`);
    console.log(`[useDashboardAssignments] Date range: ${startDate} to ${endDate}`);
    console.log(`[useDashboardAssignments] Available dashboard assignments: ${dashboardAssignments.length}`);
    
    const weekAssignments = dashboardAssignments.filter(assignment => {
      const assignmentDate = assignment.date;
      const isInWeek = assignmentDate >= startDate && assignmentDate <= endDate;
      
      console.log(`[useDashboardAssignments] Checking assignment ${assignment.id} (${assignment.location}):`, {
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

    console.log(`[useDashboardAssignments] ===== WEEK ASSIGNMENTS RESULT =====`);
    console.log(`[useDashboardAssignments] Final week assignments for ${user?.name}: ${weekAssignments.length}`);
    
    weekAssignments.forEach(assignment => {
      console.log(`[useDashboardAssignments] Week assignment "${assignment.location}" (${assignment.id}):`, {
        date: assignment.date,
        employees: assignment.employees,
        employeeCount: assignment.employees?.length || 0,
        employeeList: assignment.employees?.join(', ') || 'None'
      });
    });

    return weekAssignments;
  }, [dashboardAssignments, user?.name, user?.role]);

  // Force refresh function for debugging
  const forceRefresh = useCallback(() => {
    console.log(`[useDashboardAssignments] ===== FORCE REFRESH TRIGGERED =====`);
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
