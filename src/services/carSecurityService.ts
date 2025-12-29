import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { CarData } from '@/components/Cars/types';

export class CarSecurityService {
  /**
   * Fetches car data with enhanced security using new RLS policies
   * Automatic fuel card code masking based on user permissions
   */
  static async fetchCars(canViewFuelCardCode: boolean): Promise<CarData[]> {
    try {
      // Detect demo mode
      const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
      
      // Use direct table access - new RLS policies handle security automatically
      const { data, error } = isDemoMode 
        ? await getSchemaClient(true).from('cars').select('*').order('name')
        : await supabase.from('cars').select('*').order('name');
      
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

      // Sanitize car_number: uppercase, only A-Z, 0-9, and hyphens
      const sanitizedCarNumber = (carData.car_number || '')
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, '')
        .slice(0, 10);

      const insertData: any = {
        name: carData.name,
        car_number: sanitizedCarNumber,
        number_plate: carData.number_plate,
        has_trailer_hitch: carData.has_trailer_hitch || false,
        is_available: carData.is_available !== undefined ? carData.is_available : true,
        show_in_planner: carData.show_in_planner !== undefined ? carData.show_in_planner : true,
        notes: carData.notes || null,
        towing_capacity_with_brakes: carData.towing_capacity_with_brakes || null,
        towing_capacity_without_brakes: carData.towing_capacity_without_brakes || null,
        total_weight: carData.total_weight || null
      };

      console.log('[CarSecurityService] Creating car with data:', insertData);

      // Only include fuel_card_code if user has database permission
      if (canViewFuel && carData.fuel_card_code) {
        insertData.fuel_card_code = carData.fuel_card_code;
      } else if (!canViewFuel) {
        // For non-admin users, set a placeholder that will be masked
        insertData.fuel_card_code = 'PENDING_ADMIN_APPROVAL';
      }

      const { data, error } = isDemoMode
        ? await getSchemaClient(true).from('cars').insert(insertData).select().single()
        : await supabase.from('cars').insert(insertData).select().single();

      if (error) {
        // Check for duplicate fuel card code error
        if (error.message?.includes('unique_fuel_card_code') || error.code === '23505') {
          throw new Error('DUPLICATE_FUEL_CARD_CODE');
        }
        
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
      
      // Sanitize car_number: uppercase, only A-Z, 0-9, and hyphens
      const sanitizedCarNumber = (carData.car_number || '')
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, '')
        .slice(0, 10);

      const updateData: any = {
        name: carData.name,
        car_number: sanitizedCarNumber,
        number_plate: carData.number_plate,
        has_trailer_hitch: carData.has_trailer_hitch,
        is_available: carData.is_available,
        show_in_planner: carData.show_in_planner,
        notes: carData.notes,
        towing_capacity_with_brakes: carData.towing_capacity_with_brakes,
        towing_capacity_without_brakes: carData.towing_capacity_without_brakes,
        total_weight: carData.total_weight,
        updated_at: new Date().toISOString()
      };

      console.log('[CarSecurityService] Updating car with data:', updateData, 'for carId:', carId);

      // Only update fuel_card_code if user has database permission
      if (canViewFuel && carData.fuel_card_code !== undefined) {
        updateData.fuel_card_code = carData.fuel_card_code;
      }

      const { data, error } = isDemoMode
        ? await getSchemaClient(true).from('cars').update(updateData).eq('id', carId).select().maybeSingle()
        : await supabase.from('cars').update(updateData).eq('id', carId).select().maybeSingle();

      // Check if update was blocked by RLS (no rows returned)
      if (!data && !error) {
        throw new Error('Du har ikke tilladelse til at redigere køretøjer');
      }

      if (error) {
        // Check for duplicate fuel card code error
        if (error.message?.includes('unique_fuel_card_code') || error.code === '23505') {
          throw new Error('DUPLICATE_FUEL_CARD_CODE');
        }
        
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