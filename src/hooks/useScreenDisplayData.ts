import { useState, useEffect, useCallback } from 'react';
import { OptimizedAssignmentService } from '@/services/optimizedAssignmentService';
import { Assignment } from '@/types/assignment';

interface UseScreenDisplayDataResult {
  assignments: Assignment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Helper function to convert OptimizedAssignmentData to Assignment format
const convertToAssignment = (data: any): Assignment => {
  console.log('[convertToAssignment] Converting data:', {
    id: data.id,
    title: data.title,
    assignment_employees: data.assignment_employees,
    assignment_cars: data.assignment_cars,
    responsible_user: data.responsible_user
  });

  const assignment: Assignment = {
    id: data.id,
    title: data.title,
    description: data.description,
    date: data.assignment_date,
    fromTime: data.from_time,
    toTime: data.to_time,
    location: data.location,
    type: data.type,
    published: data.published,
    responsibleUserId: data.responsible_user_id,
    // Fix: employees should be array of IDs, not names
    employees: data.assignment_employees?.map((emp: any) => emp.user_id) || [],
    assignedEmployees: data.assignment_employees?.map((emp: any) => ({
      id: emp.user_id,
      name: emp.profiles.name,
      email: emp.profiles.email || ''
    })) || [],
    // Fix: cars should match planner format - array of names for display
    cars: data.assignment_cars?.map((car: any) => car.name) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    responsibleUser: data.responsible_user ? {
      id: data.responsible_user.id,
      name: data.responsible_user.name
    } : undefined
  };

  console.log('[convertToAssignment] Converted assignment:', assignment);
  return assignment;
};

export const useScreenDisplayData = (date: string): UseScreenDisplayDataResult => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!date) {
      console.log('[useScreenDisplayData] No date provided, clearing assignments');
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useScreenDisplayData] 🚀 FETCHING published assignments for date:', date);
      const data = await OptimizedAssignmentService.fetchPublishedAssignmentsByDate(date);
      
      console.log('[useScreenDisplayData] 📋 RAW DATA from OptimizedAssignmentService:', {
        count: data.length,
        sampleData: data[0] || null,
        allTitles: data.map(a => a.title)
      });
      
      // Convert to Assignment format
      const convertedAssignments = data.map(convertToAssignment);
      console.log('[useScreenDisplayData] ✅ FINAL CONVERTED assignments:', {
        count: convertedAssignments.length,
        assignments: convertedAssignments
      });
      
      setAssignments(convertedAssignments);
      
    } catch (err) {
      console.error('[useScreenDisplayData] 💥 ERROR:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  // Fetch data when date changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    // Clear cache to ensure fresh data
    OptimizedAssignmentService.clearCache();
    await fetchData();
  }, [fetchData]);

  return {
    assignments,
    loading,
    error,
    refetch
  };
};