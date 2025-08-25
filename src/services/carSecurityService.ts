import { supabase } from '@/integrations/supabase/client';
import { CarData } from '@/components/Cars/types';

export class CarSecurityService {
  /**
   * Fetches car data with proper field filtering based on user permissions
   * Security is now enforced at database level using can_view_fuel_codes() function
   */
  static async fetchCars(canViewFuelCardCode: boolean): Promise<CarData[]> {
    try {
      // First check if user can view fuel codes at database level
      const { data: canViewFuel } = await supabase.rpc('can_view_fuel_codes');
      
      const query = supabase.from('cars').select('*').order('car_number', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter fuel card codes based on database-level permissions
      if (!canViewFuel && data) {
        return data.map(car => ({
          ...car,
          fuel_card_code: '' // Hide fuel card code for non-admin users
        }));
      }
      
      return data || [];
    } catch (error) {
      console.error('[CarSecurityService] Error fetching cars:', error);
      throw error;
    }
  }

  /**
   * Creates a new car with proper validation of required fields based on permissions
   * Security validation using database-level permission check
   */
  static async createCar(carData: Partial<CarData>, canViewFuelCardCode: boolean): Promise<CarData> {
    try {
      // Check database-level permissions
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
        notes: carData.notes || null
      };

      // Only include fuel_card_code if user has database permission
      if (canViewFuel && carData.fuel_card_code) {
        insertData.fuel_card_code = carData.fuel_card_code;
      }

      const { data, error } = await supabase
        .from('cars')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('[CarSecurityService] Error creating car:', error);
      throw error;
    }
  }

  /**
   * Updates a car with proper field filtering based on permissions
   * Security validation using database-level permission check
   */
  static async updateCar(
    carId: string, 
    carData: Partial<CarData>, 
    canViewFuelCardCode: boolean
  ): Promise<CarData> {
    try {
      // Check database-level permissions
      const { data: canViewFuel } = await supabase.rpc('can_view_fuel_codes');
      
      const updateData: any = {
        name: carData.name,
        car_number: carData.car_number,
        number_plate: carData.number_plate,
        has_trailer_hitch: carData.has_trailer_hitch,
        is_available: carData.is_available,
        notes: carData.notes,
        updated_at: new Date().toISOString()
      };

      // Only update fuel_card_code if user has database permission
      if (canViewFuel && carData.fuel_card_code !== undefined) {
        updateData.fuel_card_code = carData.fuel_card_code;
      }

      const { data, error } = await supabase
        .from('cars')
        .update(updateData)
        .eq('id', carId)
        .select()
        .single();

      if (error) throw error;
      
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