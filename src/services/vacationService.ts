
import { supabase } from "@/integrations/supabase/client";
import { Vacation, VacationStatus, isValidVacationStatus } from "@/types/vacation";
import { InsertVacation } from "@/types/supabase";

/**
 * Fetch all vacations
 */
export const fetchVacations = async (): Promise<Vacation[]> => {
  try {
    const { data, error } = await supabase
      .from('vacations')
      .select(`
        *,
        profiles:profile_id(name)
      `);

    if (error) {
      throw error;
    }

    // Transform data to match our Vacation interface
    return data.map((v: any) => ({
      id: v.id,
      employeeId: v.profile_id,
      employeeName: v.profiles.name,
      startDate: new Date(v.start_date),
      endDate: new Date(v.end_date),
      reason: v.reason,
      status: isValidVacationStatus(v.status) ? v.status : 'pending',
      notes: v.notes,
      createdAt: new Date(v.created_at)
    }));
  } catch (error) {
    console.error('Error fetching vacations:', error);
    throw error;
  }
};

/**
 * Submit a vacation request
 */
export const submitVacation = async (
  employeeId: string,
  startDate: Date,
  endDate: Date,
  reason: string,
  note: string | null
): Promise<Vacation | null> => {
  try {
    // Prepare vacation data for Supabase
    const vacationData: InsertVacation = {
      profile_id: employeeId,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      reason: reason,
      status: 'pending',
      notes: note || null
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('vacations')
      .insert(vacationData)
      .select(`
        *,
        profiles:profile_id(name)
      `);

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      // Transform to our Vacation interface
      return {
        id: data[0].id,
        employeeId: data[0].profile_id,
        employeeName: data[0].profiles.name,
        startDate: new Date(data[0].start_date),
        endDate: new Date(data[0].end_date),
        reason: data[0].reason,
        status: isValidVacationStatus(data[0].status) ? data[0].status : 'pending',
        notes: data[0].notes,
        createdAt: new Date(data[0].created_at)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error submitting vacation request:', error);
    throw error;
  }
};

/**
 * Update vacation status (approve/reject)
 */
export const updateVacationStatus = async (
  vacationId: string, 
  status: VacationStatus, 
  notes: string | null
): Promise<boolean> => {
  try {
    // Update in Supabase
    const { error } = await supabase
      .from('vacations')
      .update({ 
        status: status,
        notes: notes || null
      })
      .eq('id', vacationId);

    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Error ${status} vacation:`, error);
    throw error;
  }
};

/**
 * Helper function to explicitly get a valid vacation status
 */
export const getValidVacationStatus = (status: string): VacationStatus => {
  if (isValidVacationStatus(status)) {
    return status;
  }
  return 'pending';
};
