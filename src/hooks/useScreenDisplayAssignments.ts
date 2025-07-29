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
  const [debugInfo, setDebugInfo] = useState<any>({});

  const fetchAssignmentsByDate = useCallback(async (fetchDate: string) => {
    console.log(`[useScreenDisplayAssignments] Starting fetch for date: ${fetchDate}`);
    
    if (!fetchDate) {
      console.log('[useScreenDisplayAssignments] No date provided, skipping fetch');
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`[useScreenDisplayAssignments] 🔍 FETCHING published assignments for date: ${fetchDate}`);
      console.log(`[useScreenDisplayAssignments] 📅 Date format check: ${fetchDate} (length: ${fetchDate.length})`);
      
      // Add network timing debug
      const startTime = Date.now();
      const result = await OptimizedAssignmentService.fetchPublishedAssignmentsByDate(fetchDate);
      const endTime = Date.now();
      
      console.log(`[useScreenDisplayAssignments] 📊 NETWORK TIMING: ${endTime - startTime}ms`);
      console.log(`[useScreenDisplayAssignments] 📦 RAW DATABASE RESULT:`, {
        data: result,
        length: result?.length || 0,
        type: typeof result,
        isArray: Array.isArray(result)
      });
      
      // Enhanced conversion with error tracking
      let convertedAssignments: Assignment[] = [];
      const conversionErrors: any[] = [];
      
      if (result && Array.isArray(result)) {
        console.log(`[useScreenDisplayAssignments] 🔄 Converting ${result.length} assignments...`);
        
        result.forEach((item, index) => {
          try {
            const converted = convertToAssignment(item);
            convertedAssignments.push(converted);
            console.log(`[useScreenDisplayAssignments] ✅ Converted assignment ${index + 1}:`, {
              id: converted.id,
              title: converted.title,
              date: converted.date,
              employees: converted.employees,
              cars: converted.cars
            });
          } catch (conversionError) {
            console.error(`[useScreenDisplayAssignments] ❌ Conversion error for item ${index}:`, conversionError, item);
            conversionErrors.push({ index, error: conversionError, item });
          }
        });
      } else {
        console.warn(`[useScreenDisplayAssignments] ⚠️ Invalid result format:`, { result, type: typeof result });
      }

      const debugData = {
        fetchDate,
        rawResultLength: result?.length || 0,
        convertedLength: convertedAssignments.length,
        conversionErrors: conversionErrors.length,
        networkTime: endTime - startTime,
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(debugData);
      
      console.log(`[useScreenDisplayAssignments] 🎯 FINAL RESULT:`, {
        ...debugData,
        sampleAssignment: convertedAssignments[0] || null,
        allAssignmentTitles: convertedAssignments.map(a => a.title)
      });
      
      setAssignments(convertedAssignments);
      
      // Force a re-render check
      setTimeout(() => {
        console.log(`[useScreenDisplayAssignments] 🔄 POST-SET STATE CHECK: assignments.length = ${convertedAssignments.length}`);
      }, 100);
      
    } catch (err) {
      console.error('[useScreenDisplayAssignments] 💥 CRITICAL ERROR fetching assignments:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        fetchDate
      });
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'));
      setAssignments([]);
    } finally {
      setLoading(false);
      console.log(`[useScreenDisplayAssignments] ✋ Loading complete for date: ${fetchDate}`);
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
    refetch,
    debugInfo
  };
};