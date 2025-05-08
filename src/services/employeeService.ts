
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
 * Create a new employee
 */
export const createEmployee = async (formData: EmployeeFormData) => {
  try {
    // First create the user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: formData.email,
      email_confirm: true,
      password: 'tempPassword123', // Temporary password that will be reset
      user_metadata: {
        name: formData.name
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // The profile should be created automatically via trigger,
    // but we'll update it with the additional data
    const { error: profileError } = await supabase
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
      .eq('id', authData.user.id);

    if (profileError) {
      throw profileError;
    }

    // Return the new employee
    return {
      id: authData.user.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      jobTitle: formData.jobTitle,
      role: formData.role,
      onLeave: formData.onLeave,
      notes: formData.notes
    } as Employee;
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
 * Delete an employee
 */
export const deleteEmployee = async (employeeId: string): Promise<boolean> => {
  try {
    // Delete user in auth (will cascade delete profile due to foreign key)
    const { error } = await supabase.auth.admin.deleteUser(employeeId);
    
    if (error) {
      throw error;
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
