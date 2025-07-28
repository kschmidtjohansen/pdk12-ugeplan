import { useState, useEffect, useCallback } from 'react';
import { OptimizedAssignmentService, OptimizedAssignmentData } from '@/services/optimizedAssignmentService';
import { Assignment } from '@/types/assignment';

// Helper function to convert OptimizedAssignmentData to Assignment
const convertToAssignment = (data: OptimizedAssignmentData): Assignment => {
  // Convert assignment_employees to employee names array
  const employees = data.assignment_employees?.map(emp => emp.profiles.name).filter(Boolean) || [];
  
  // Handle car data - support both legacy car_id and new car_ids array
  let cars: string[] = [];
  let firstCar = '';
  
  if (data.assignment_cars && data.assignment_cars.length > 0) {
    // Use the enriched car data from the service
    cars = data.assignment_cars.map(car => car.id);
    firstCar = cars[0] || '';
  } else if (data.car_ids && Array.isArray(data.car_ids) && data.car_ids.length > 0) {
    // Fallback to car_ids array
    cars = data.car_ids;
    firstCar = cars[0] || '';
  } else if (data.car_id) {
    // Legacy single car_id
    cars = [data.car_id];
    firstCar = data.car_id;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    date: data.assignment_date,
    fromTime: data.from_time,
    toTime: data.to_time,
    location: data.location,
    type: data.type,
    published: data.published,
    responsibleUserId: data.responsible_user_id || undefined,
    employees: employees,
    car: firstCar,
    cars: cars,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    responsibleUser: data.responsible_user
  };
};

export const useScreenDisplayAssignments = (date: string) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAssignmentsByDate = useCallback(async (fetchDate: string) => {
    if (!fetchDate) {
      console.log('[useScreenDisplayAssignments] No date provided, skipping fetch');
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`[useScreenDisplayAssignments] Fetching published assignments for date: ${fetchDate}`);
      
      const result = await OptimizedAssignmentService.fetchPublishedAssignmentsByDate(fetchDate);
      console.log(`[useScreenDisplayAssignments] Raw database result:`, result);
      console.log(`[useScreenDisplayAssignments] Result length: ${result.length}`);
      
      // Convert OptimizedAssignmentData to Assignment format
      const convertedAssignments = result.map(convertToAssignment);

      console.log(`[useScreenDisplayAssignments] Successfully fetched ${convertedAssignments.length} assignments for date ${fetchDate}`);
      console.log(`[useScreenDisplayAssignments] Sample assignment data:`, convertedAssignments[0]);
      
      setAssignments(convertedAssignments);
    } catch (err) {
      console.error('[useScreenDisplayAssignments] Error fetching assignments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    // Clear cache before refetching
    OptimizedAssignmentService.clearCache();
    await fetchAssignmentsByDate(date);
  }, [date, fetchAssignmentsByDate]);

  useEffect(() => {
    fetchAssignmentsByDate(date);
  }, [date, fetchAssignmentsByDate]);

  return {
    assignments,
    loading,
    error,
    refetch
  };
};