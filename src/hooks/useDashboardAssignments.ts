
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
  
  // Apply dashboard-specific filtering
  const dashboardAssignments = filterForDashboard(assignments);
  
  console.log(`[useDashboardAssignments] User: ${user?.name} (${user?.role})`);
  console.log(`[useDashboardAssignments] Total assignments: ${assignments.length}`);
  console.log(`[useDashboardAssignments] Dashboard filtered assignments: ${dashboardAssignments.length}`);
  console.log(`[useDashboardAssignments] Dashboard assignment details:`, dashboardAssignments.map(a => ({
    id: a.id,
    location: a.location,
    date: a.date,
    published: a.published,
    employees: a.employees
  })));

  // Filter assignments for a specific week
  const getAssignmentsForWeek = useCallback((startDate: string, endDate: string) => {
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

    console.log(`[useDashboardAssignments] Week assignments for ${user?.name}:`, weekAssignments.map(a => ({
      id: a.id,
      location: a.location,
      employees: a.employees,
      date: a.date
    })));

    return weekAssignments;
  }, [dashboardAssignments, user?.name]);

  return {
    assignments: dashboardAssignments,
    loading,
    error,
    fetchAssignments,
    getAssignmentsForWeek
  };
};
