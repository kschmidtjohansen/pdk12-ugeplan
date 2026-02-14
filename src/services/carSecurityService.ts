import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { CarData } from '@/components/Cars/types';

export class CarSecurityService {
  /**
   * Fetches car data with enhanced security using new RLS policies
   * Automatic fuel card code masking based on user permissions
   */
  static async fetchCars(canViewFuelCardCode: boolean, departmentId?: string, subDepartmentId?: string | null): Promise<CarData[]> {
    try {
      // Detect demo mode
      const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
      
      // Use direct table access - new RLS policies handle security automatically
      let query = isDemoMode 
        ? getSchemaClient(true).from('cars').select('*').order('name')
        : supabase.from('cars').select('*').order('name');
      
      // Filter by department if provided (production only)
      if (!isDemoMode && departmentId) {
        query = query.eq('department_id', departmentId);
      }
      // Filter by sub-department using junction table
      if (!isDemoMode && subDepartmentId) {
        const { data: carSubDepts } = await supabase
          .from('car_sub_departments')
          .select('car_id')
          .eq('sub_department_id', subDepartmentId);
        
        const carIds = (carSubDepts || []).map(r => (r as any).car_id);
        if (carIds.length > 0) {
          query = query.in('id', carIds);
        } else {
          // No cars in this sub-department
          return [];
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        // If access is denied due to authentication, provide clear error
        if (error.message?.includes('Authentication required')) {
          throw new Error('You must be logged in to access vehicle data');
        }
        throw error;
      }
      
      // The database automatically masks fuel card codes for non-authorized users
      // No additional client-side filtering needed due to RLS policies
      return data || [];
    } catch (error) {
      console.error('[CarSecurityService] Error fetching cars:', error);
      
      // Log security event for failed access attempts
      try {
        await supabase.rpc('log_security_event_safe', {
          event_type: 'car_access_failure',
          event_message: `Failed to fetch cars: ${error instanceof Error ? error.message : 'Unknown error'}`,
          event_details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          },
          severity: 'warning'
        });
      } catch (logError) {
        console.warn('[CarSecurityService] Failed to log security event:', logError);
      }
      
      throw error;
    }
  }

  /**
   * Creates a new car with enhanced security validation and logging
   * Uses database-level permission checking and security logging
   */
  static async createCar(carData: Partial<CarData>, canViewFuelCardCode: boolean): Promise<CarData> {
    try {
      // Detect demo mode
      const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
      
      // Check database-level permissions first
      const { data: canViewFuel } = await supabase.rpc('can_view_fuel_codes');
      
      // Validate required fields
      if (!carData.name || !carData.car_number || !carData.number_plate) {
        throw new Error('Name, car number, and number plate are required');
      }

      // Only require fuel card code if user has database permission to manage it
      if (canViewFuel && !carData.fuel_card_code) {
        throw new Error('Fuel card code is required for administrators');
      }

      const insertData: any = {
        name: carData.name,
        car_number: carData.car_number,
        number_plate: carData.number_plate,
        has_trailer_hitch: carData.has_trailer_hitch || false,
        is_available: carData.is_available !== undefined ? carData.is_available : true,
        show_in_planner: carData.show_in_planner !== undefined ? carData.show_in_planner : true,
        notes: carData.notes || null,
        towing_capacity_with_brakes: carData.towing_capacity_with_brakes || null,
        towing_capacity_without_brakes: carData.towing_capacity_without_brakes || null,
        total_weight: carData.total_weight || null,
        department_id: (carData as any).department_id || null,
        sub_department_id: carData.sub_department_id || null,
      };

      console.log('[CarSecurityService] Creating car with data:', insertData);

      // Include fuel_card_code if user has permission (either DB-level or client-level)
      if ((canViewFuel || canViewFuelCardCode) && carData.fuel_card_code) {
        insertData.fuel_card_code = carData.fuel_card_code;
      } else {
        insertData.fuel_card_code = carData.fuel_card_code || '';
      }

      const { data, error } = isDemoMode
        ? await getSchemaClient(true).from('cars').insert(insertData).select().single()
        : await supabase.from('cars').insert(insertData).select().single();

      if (error) {
        // Log failed car creation attempt
        await supabase.rpc('log_security_event_safe', {
          event_type: 'car_creation_failure',
          event_message: `Failed to create car: ${error.message}`,
          event_details: {
            car_data: { name: carData.name, car_number: carData.car_number },
            error: error.message
          },
          severity: 'warning'
        });
        throw error;
      }

      // Log successful car creation
      await supabase.rpc('log_security_event_safe', {
        event_type: 'car_creation_success',
        event_message: `Successfully created car: ${data.name}`,
        event_details: {
          car_id: data.id,
          car_name: data.name,
          created_by_admin: canViewFuel
        },
        severity: 'info'
      });
      
      return data;
    } catch (error) {
      console.error('[CarSecurityService] Error creating car:', error);
      throw error;
    }
  }

  /**
   * Updates a car with enhanced security validation and logging
   * Uses database-level permission checking and security logging
   */
  static async updateCar(
    carId: string, 
    carData: Partial<CarData>, 
    canViewFuelCardCode: boolean
  ): Promise<CarData> {
    try {
      // Detect demo mode
      const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
      
      // Check database-level permissions
      const { data: canViewFuel } = await supabase.rpc('can_view_fuel_codes');
      
      const updateData: any = {
        name: carData.name,
        car_number: carData.car_number,
        number_plate: carData.number_plate,
        has_trailer_hitch: carData.has_trailer_hitch,
        is_available: carData.is_available,
        show_in_planner: carData.show_in_planner,
        notes: carData.notes,
        towing_capacity_with_brakes: carData.towing_capacity_with_brakes,
        towing_capacity_without_brakes: carData.towing_capacity_without_brakes,
        total_weight: carData.total_weight,
        department_id: (carData as any).department_id || null,
        sub_department_id: carData.sub_department_id || null,
        updated_at: new Date().toISOString()
      };

      console.log('[CarSecurityService] Updating car with data:', updateData, 'for carId:', carId);

      // Only update fuel_card_code if user has database permission
      if (canViewFuel && carData.fuel_card_code !== undefined) {
        updateData.fuel_card_code = carData.fuel_card_code;
      }

      const { data, error } = isDemoMode
        ? await getSchemaClient(true).from('cars').update(updateData).eq('id', carId).select().single()
        : await supabase.from('cars').update(updateData).eq('id', carId).select().single();

      if (error) {
        // Log failed car update attempt
        await supabase.rpc('log_security_event_safe', {
          event_type: 'car_update_failure',
          event_message: `Failed to update car ${carId}: ${error.message}`,
          event_details: {
            car_id: carId,
            error: error.message
          },
          severity: 'warning'
        });
        throw error;
      }

      // Log successful car update
      await supabase.rpc('log_security_event_safe', {
        event_type: 'car_update_success',
        event_message: `Successfully updated car: ${data.name}`,
        event_details: {
          car_id: data.id,
          car_name: data.name,
          updated_by_admin: canViewFuel
        },
        severity: 'info'
      });
      
      return data;
    } catch (error) {
      console.error('[CarSecurityService] Error updating car:', error);
      throw error;
    }
  }

  /**
   * Note: Permission checking is handled in AuthContext.tsx
   * This service relies on the permission being checked before calling these methods
   */
}