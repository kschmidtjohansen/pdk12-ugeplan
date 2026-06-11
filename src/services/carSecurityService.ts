import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { CarData } from '@/components/Cars/types';

export class CarSecurityService {
  static async fetchCars(canViewFuelCardCode: boolean, departmentId?: string, subDepartmentId?: string | null): Promise<CarData[]> {
    try {
      const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
      const client = getSchemaClient(isDemoMode);
      let query = client.from('cars').select('*').order('name');
      
      if (!isDemoMode && departmentId) {
        query = query.eq('department_id', departmentId);
      }
      if (!isDemoMode && subDepartmentId) {
        // Strikt isolation: vis kun biler eksplicit tilknyttet denne underafdeling
        const { data: carSubDepts } = await supabase
          .from('car_sub_departments')
          .select('car_id')
          .eq('sub_department_id', subDepartmentId);

        const carIds = (carSubDepts || []).map(r => (r as any).car_id);
        if (carIds.length === 0) {
          return [];
        }
        query = query.in('id', carIds);
      }
      
      const { data, error } = await query;
      
      if (error) {
        if (error.message?.includes('Authentication required')) {
          throw new Error('You must be logged in to access vehicle data');
        }
        throw error;
      }
      
      return data || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('[CarSecurityService] Error fetching cars:', error);
      
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
      } catch (_logError) {
        if (import.meta.env.DEV) console.warn('[CarSecurityService] Failed to log security event:', _logError);
      }
      
      throw error;
    }
  }

  static async createCar(carData: Partial<CarData>, canViewFuelCardCode: boolean): Promise<CarData> {
    try {
      const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
      const { data: canViewFuel } = await supabase.rpc('can_view_fuel_codes');
      
      if (!carData.name || !carData.car_number || !carData.number_plate) {
        throw new Error('Name, car number, and number plate are required');
      }

      const insertData: any = {
        name: carData.name,
        car_number: carData.car_number,
        number_plate: carData.number_plate,
        has_trailer_hitch: carData.has_trailer_hitch || false,
        is_available: carData.is_available !== undefined ? carData.is_available : true,
        show_in_planner: carData.show_in_planner !== undefined ? carData.show_in_planner : true,
        is_auxiliary: carData.is_auxiliary === true,
        notes: carData.notes || null,
        towing_capacity_with_brakes: carData.towing_capacity_with_brakes || null,
        towing_capacity_without_brakes: carData.towing_capacity_without_brakes || null,
        total_weight: carData.total_weight || null,
        department_id: (carData as any).department_id || null,
        sub_department_id: carData.sub_department_id || null,
      };

      if (import.meta.env.DEV) console.log('[CarSecurityService] Creating car with data:', insertData);

      insertData.fuel_card_code = carData.fuel_card_code?.trim() || null;

      const dbClient = getSchemaClient(isDemoMode);
      const { data, error } = await dbClient.from('cars').insert(insertData).select().single();

      if (error) {
        await supabase.rpc('log_security_event_safe', {
          event_type: 'car_creation_failure',
          event_message: `Failed to create car: ${error.message}`,
          event_details: { car_data: { name: carData.name, car_number: carData.car_number }, error: error.message },
          severity: 'warning'
        });
        throw error;
      }

      await supabase.rpc('log_security_event_safe', {
        event_type: 'car_creation_success',
        event_message: `Successfully created car: ${data.name}`,
        event_details: { car_id: data.id, car_name: data.name, created_by_admin: canViewFuel },
        severity: 'info'
      });
      
      return data;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[CarSecurityService] Error creating car:', error);
      throw error;
    }
  }

  static async updateCar(carId: string, carData: Partial<CarData>, canViewFuelCardCode: boolean): Promise<CarData> {
    try {
      const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
      const { data: canViewFuel } = await supabase.rpc('can_view_fuel_codes');
      
      // VIGTIGT: department_id medtages IKKE i updateData.
      // CarFormData indeholder ikke department_id, og vi må aldrig overskrive
      // den eksisterende værdi med NULL. department_id sættes kun ved oprettelse.
      const updateData: any = {
        name: carData.name,
        car_number: carData.car_number,
        number_plate: carData.number_plate,
        has_trailer_hitch: carData.has_trailer_hitch,
        is_available: carData.is_available,
        show_in_planner: carData.show_in_planner,
        is_auxiliary: carData.is_auxiliary === true,
        notes: carData.notes,
        towing_capacity_with_brakes: carData.towing_capacity_with_brakes,
        towing_capacity_without_brakes: carData.towing_capacity_without_brakes,
        total_weight: carData.total_weight,
        updated_at: new Date().toISOString()
      };

      if (import.meta.env.DEV) console.log('[CarSecurityService] Updating car with data:', updateData, 'for carId:', carId);

      if (canViewFuel && carData.fuel_card_code !== undefined) {
        updateData.fuel_card_code = carData.fuel_card_code;
      }

      const dbClient = getSchemaClient(isDemoMode);
      const { data, error } = await dbClient.from('cars').update(updateData).eq('id', carId).select().single();

      if (error) {
        await supabase.rpc('log_security_event_safe', {
          event_type: 'car_update_failure',
          event_message: `Failed to update car ${carId}: ${error.message}`,
          event_details: { car_id: carId, error: error.message },
          severity: 'warning'
        });
        throw error;
      }

      await supabase.rpc('log_security_event_safe', {
        event_type: 'car_update_success',
        event_message: `Successfully updated car: ${data.name}`,
        event_details: { car_id: data.id, car_name: data.name, updated_by_admin: canViewFuel },
        severity: 'info'
      });
      
      return data;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[CarSecurityService] Error updating car:', error);
      throw error;
    }
  }
}
