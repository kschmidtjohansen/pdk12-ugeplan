import { supabase } from '@/integrations/supabase/client';

export interface ScreenDisplayAssignment {
  id: string;
  title: string;
  description: string | null;
  date: string;
  fromTime: string;
  toTime: string;
  location: string;
  type: string | null;
  employees: string[];
  cars: string[];
}

export class ScreenDisplayService {
  /**
   * Fetch published assignments for a specific date
   * Simple, focused implementation for screen display
   */
  static async fetchAssignmentsByDate(date: string): Promise<ScreenDisplayAssignment[]> {
    try {
      console.log(`[ScreenDisplayService] Fetching assignments for date: ${date}`);
      
      // Fetch assignments for the specific date
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          type,
          car_id,
          car_ids
        `)
        .eq('assignment_date', date)
        .eq('published', true)
        .order('from_time', { ascending: true });

      if (assignmentsError) {
        console.error('[ScreenDisplayService] Error fetching assignments:', assignmentsError);
        throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
      }

      if (!assignments || assignments.length === 0) {
        console.log('[ScreenDisplayService] No assignments found for date:', date);
        return [];
      }

      console.log(`[ScreenDisplayService] Found ${assignments.length} assignments`);
      
      // Get assignment IDs for employee lookup
      const assignmentIds = assignments.map(a => a.id);
      
      // Fetch employees for these assignments
      const { data: employeeData, error: employeeError } = await supabase
        .from('assignments_employees')
        .select(`
          assignment_id,
          profiles!inner(name)
        `)
        .in('assignment_id', assignmentIds);

      if (employeeError) {
        console.warn('[ScreenDisplayService] Error fetching employees:', employeeError);
      }

      // Get unique car IDs
      const carIds = new Set<string>();
      assignments.forEach(assignment => {
        if (assignment.car_id) carIds.add(assignment.car_id);
        if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
          assignment.car_ids.forEach(id => carIds.add(id));
        }
      });

      // Fetch car names
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .select('id, name')
        .in('id', Array.from(carIds));

      if (carError) {
        console.warn('[ScreenDisplayService] Error fetching cars:', carError);
      }

      // Transform to screen display format
      const screenAssignments: ScreenDisplayAssignment[] = assignments.map(assignment => {
        // Get employees for this assignment
        const assignmentEmployees = employeeData
          ?.filter(emp => emp.assignment_id === assignment.id)
          ?.map(emp => emp.profiles?.name)
          ?.filter(Boolean) || [];

        // Get cars for this assignment
        const assignmentCars: string[] = [];
        if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
          assignment.car_ids.forEach(carId => {
            const car = carData?.find(c => c.id === carId);
            if (car) assignmentCars.push(car.name);
          });
        } else if (assignment.car_id) {
          const car = carData?.find(c => c.id === assignment.car_id);
          if (car) assignmentCars.push(car.name);
        }

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          type: assignment.type,
          employees: assignmentEmployees,
          cars: assignmentCars
        };
      });

      console.log(`[ScreenDisplayService] Transformed ${screenAssignments.length} assignments`);
      return screenAssignments;
      
    } catch (error) {
      console.error('[ScreenDisplayService] Service error:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }
}