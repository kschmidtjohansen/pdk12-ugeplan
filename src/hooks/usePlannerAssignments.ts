
import { useState, useEffect } from 'react';
import { useAssignments } from './useAssignments';
import { useAssignmentPublishing } from './useAssignmentPublishing';
import { useAssignmentFilters } from './useAssignmentFilters';
import { getWeekDates } from '@/utils/weekDates';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';

// Main hook combining all assignment-related functionality
export const usePlannerAssignments = (selectedWeek?: number) => {
  const { 
    assignments: allAssignments, 
    loading,
    error,
    createAssignment, 
    updateAssignment, 
    deleteAssignment 
  } = useAssignments();
  
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  
  // Pass the assignments and update function to the publishing hook
  const { 
    publishAssignments, 
    publishAssignment, 
    publishAssignmentsByDate 
  } = useAssignmentPublishing(allAssignments, updateAssignment);
  
  // Subscribe to real-time updates for published assignments
  useEffect(() => {
    const channel = supabase
      .channel('assignment_publish_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'assignments',
          filter: 'published=true'
        },
        (payload) => {
          console.log('Assignment published:', payload);
          // You could add specific handling for published assignments here
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Filter assignments by selected week whenever assignments or selectedWeek changes
  useEffect(() => {
    if (selectedWeek !== undefined) {
      const weekDates = getWeekDates(selectedWeek);
      const filtered = allAssignments.filter(assignment => {
        const assignmentDate = new Date(assignment.date);
        return assignmentDate >= weekDates.start && assignmentDate <= weekDates.end;
      });
      setFilteredAssignments(filtered);
    } else {
      setFilteredAssignments(allAssignments);
    }
  }, [allAssignments, selectedWeek]);

  return {
    assignments: filteredAssignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignments,
    publishAssignment,
    publishAssignmentsByDate,
    getWeekDates
  };
};
