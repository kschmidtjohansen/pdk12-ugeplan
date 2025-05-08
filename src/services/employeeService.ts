
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/employee";
import { TableProfile } from "@/types/supabase";
import { UserRole } from "@/types/auth";
import { EmployeeFormData } from "@/hooks/useEmployeeForm";

/**
 * Fetch all employees from the database
 */
export const fetchEmployees = async (): Promise<Employee[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      throw error;
    }

    // Transform profile data to match our Employee interface
    return data.map((profile: TableProfile) => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone || '',
      jobTitle: profile.job_title || '',
      role: profile.role,
      onLeave: profile.on_leave,
      notes: profile.notes || ''
    }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

/**
 * Create a new employee using the admin-create-user edge function
 */
export const createEmployee = async (formData: EmployeeFormData): Promise<Employee> => {
  try {
    // Call the edge function to create a user with admin privileges
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { formData }
    });

    if (error) {
      console.error('Edge function error creating employee:', error);
      throw new Error(`Failed to create employee: ${error.message || 'Unknown error'}`);
    }

    if (!data || data.error) {
      throw new Error(`Failed to create employee: ${data?.error || 'Unknown error'}`);
    }

    // Return the new employee data from the edge function
    return data as Employee;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

/**
 * Update an existing employee
 */
export const updateEmployee = async (employeeId: string, formData: EmployeeFormData) => {
  try {
    // Update profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        job_title: formData.jobTitle,
        role: formData.role,
        on_leave: formData.onLeave,
        notes: formData.notes
      })
      .eq('id', employeeId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

/**
 * Delete an employee using the admin-delete-user edge function
 */
export const deleteEmployee = async (employeeId: string): Promise<boolean> => {
  try {
    // Call the edge function to delete a user with admin privileges
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { userId: employeeId }
    });

    if (error) {
      console.error('Edge function error deleting employee:', error);
      throw new Error(`Failed to delete employee: ${error.message || 'Unknown error'}`);
    }

    if (data.error) {
      throw new Error(`Failed to delete employee: ${data.error}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

/**
 * Toggle an employee's leave status
 */
export const toggleEmployeeLeave = async (employeeId: string, newLeaveStatus: boolean): Promise<boolean> => {
  try {
    // Update in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ on_leave: newLeaveStatus })
      .eq('id', employeeId);

    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error toggling employee leave status:', error);
    throw error;
  }
};
