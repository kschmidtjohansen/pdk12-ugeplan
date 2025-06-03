
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/context/NotificationContext';
import { safeProperty } from '@/utils/dbHelpers';

export const useEmployeeActions = (refreshEmployees: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();

  /**
   * Update employee onLeave status
   */
  const toggleEmployeeLeave = async (employee: any, setOnLeave: boolean, notes: string | null = null) => {
    if (!employee?.id) {
      console.error('Employee ID is missing');
      return false;
    }
    
    try {
      // Update the onLeave status and optionally update notes
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          on_leave: setOnLeave,
          notes: notes || null
        })
        .eq('id', employee.id)
        .select();
      
      if (error) throw error;
      
      // Show toast notification
      toast({
        title: setOnLeave 
          ? t('employees.employeeOnLeave') 
          : t('employees.employeeAvailable'),
        description: setOnLeave 
          ? t('employees.employeeOnLeaveMsg', { name: employee.name }) 
          : t('employees.employeeAvailableMsg', { name: employee.name })
      });
      
      // Refresh the employees list after toggle
      await refreshEmployees();
      
      return true;
    } catch (err) {
      console.error('Error toggling employee leave status:', err);
      
      toast({
        title: t('common.error'),
        description: t('employees.updateError'),
        variant: 'destructive',
      });
      
      return false;
    }
  };

  /**
   * Update employee leave status based on active vacations
   */
  const updateEmployeeLeaveStatusFromVacations = async () => {
    try {
      console.log('Updating employee leave status from vacations...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString().split('T')[0];
      
      // 1. Find employees who are currently on approved vacation
      const { data: activeVacations, error: vacationError } = await supabase
        .from('vacations')
        .select('user_id')
        .eq('status', 'approved')
        .lte('start_date', todayISO)
        .gte('end_date', todayISO);
      
      if (vacationError) {
        console.error('Error fetching active vacations:', vacationError);
        return false;
      }
      
      // Filter out any vacations with invalid user_id
      const validActiveVacations = (activeVacations || []).filter(vacation => 
        vacation.user_id && vacation.user_id !== 'undefined' && vacation.user_id.length > 0
      );
      
      // Create a set of user IDs who are on active vacations
      const employeesOnVacation = new Set(
        validActiveVacations.map(vacation => vacation.user_id)
      );
      
      console.log(`Found ${employeesOnVacation.size} employees on active vacation`);
      
      // 2. Find all employees and update their status if necessary
      const { data: employees, error: employeesError } = await supabase
        .from('profiles')
        .select('id, on_leave')
        .not('id', 'is', null);
      
      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        return false;
      }
      
      // Track employees who need to be marked as on leave or available
      const employeesToMarkOnLeave: string[] = [];
      const employeesToMarkAvailable: string[] = [];
      
      // Process each employee
      for (const employee of employees || []) {
        // Skip employees with invalid IDs
        if (!employee.id || employee.id === 'undefined') {
          console.warn('Skipping employee with invalid ID:', employee);
          continue;
        }
        
        const isOnVacation = employeesOnVacation.has(employee.id);
        
        // If employee is on vacation but not marked as on leave, mark them on leave
        if (isOnVacation && !employee.on_leave) {
          employeesToMarkOnLeave.push(employee.id);
        }
        
        // If employee is not on vacation but is marked as on leave due to vacation 
        // (we'll need to check if they were marked as on leave due to a vacation)
        if (!isOnVacation && employee.on_leave) {
          // Check if they were marked as on leave due to a vacation that has ended
          const { data: recentVacations, error: recentError } = await supabase
            .from('vacations')
            .select('id')
            .eq('user_id', employee.id)
            .eq('status', 'approved')
            .lt('end_date', todayISO)
            .order('end_date', { ascending: false })
            .limit(1);
          
          if (recentError) {
            console.error(`Error checking recent vacations for employee ${employee.id}:`, recentError);
            continue;
          }
          
          // If there was a recent vacation that has ended, mark them as available
          if (recentVacations && recentVacations.length > 0) {
            employeesToMarkAvailable.push(employee.id);
          }
        }
      }
      
      console.log(`Marking ${employeesToMarkOnLeave.length} employees as on leave`);
      console.log(`Marking ${employeesToMarkAvailable.length} employees as available`);
      
      // Update employees who need to be marked as on leave
      if (employeesToMarkOnLeave.length > 0) {
        const { error: markOnLeaveError } = await supabase
          .from('profiles')
          .update({ on_leave: true })
          .in('id', employeesToMarkOnLeave);
        
        if (markOnLeaveError) {
          console.error('Error marking employees as on leave:', markOnLeaveError);
        }
      }
      
      // Update employees who need to be marked as available
      if (employeesToMarkAvailable.length > 0) {
        const { error: markAvailableError } = await supabase
          .from('profiles')
          .update({ on_leave: false })
          .in('id', employeesToMarkAvailable);
        
        if (markAvailableError) {
          console.error('Error marking employees as available:', markAvailableError);
        }
      }
      
      // If any updates were made, refresh the employee list
      if (employeesToMarkOnLeave.length > 0 || employeesToMarkAvailable.length > 0) {
        await refreshEmployees();
      }
      
      return true;
    } catch (err) {
      console.error('Error updating employee leave status from vacations:', err);
      return false;
    }
  };

  /**
   * Create a new employee
   */
  const createEmployee = async (formData: any) => {
    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.name) {
        throw new Error('Email, password, and name are required');
      }

      // Call the admin-create-user function to create a new user
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role || 'servicemedarbejder'
        }
      });
      
      if (error) throw error;
      
      if (data.error) {
        console.error('Function error:', data.error);
        throw new Error(data.error);
      }
      
      console.log('Employee created:', data);
      
      // Update the profile with additional fields
      if (data.id && data.id !== 'undefined') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: formData.phone || null,
            job_title: formData.jobTitle || null,
            on_leave: formData.onLeave || false,
            notes: formData.notes || null
          })
          .eq('id', data.id);
        
        if (profileError) {
          console.error('Error updating profile:', profileError);
          throw profileError;
        }
      }
      
      toast({
        title: t('employees.employeeAdded'),
        description: t('employees.employeeAddedMsg', { name: formData.name })
      });
      
      // Refresh the employees list
      await refreshEmployees();
      
      return true;
    } catch (err) {
      console.error('Error creating employee:', err);
      
      // Show error toast with specific message if available
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Failed to create employee',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  /**
   * Update an existing employee
   */
  const updateEmployee = async (employee: any, formData: any) => {
    if (!employee?.id || employee.id === 'undefined') {
      console.error('Invalid employee ID');
      return false;
    }
    
    try {
      // Update the profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          job_title: formData.jobTitle || null,
          on_leave: formData.onLeave || false,
          notes: formData.notes || null
        })
        .eq('id', employee.id);
      
      if (profileError) throw profileError;
      
      // Update the user role if it changed
      if (employee.role !== formData.role) {
        const { error: roleError } = await supabase.functions.invoke('admin-user-role', {
          body: {
            userId: employee.id,
            role: formData.role
          }
        });
        
        if (roleError) throw roleError;
      }
      
      toast({
        title: t('employees.employeeUpdated'),
        description: t('employees.employeeUpdatedMsg', { name: formData.name })
      });
      
      // Refresh the employees list
      await refreshEmployees();
      
      return true;
    } catch (err) {
      console.error('Error updating employee:', err);
      
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('employees.updateError'),
        variant: 'destructive',
      });
      
      return false;
    }
  };

  /**
   * Delete an employee
   */
  const deleteEmployee = async (employeeId: string, allEmployees: any[]) => {
    if (!employeeId || employeeId === 'undefined') {
      console.error('Invalid employee ID');
      return false;
    }
    
    try {
      // Find employee name before deletion
      const employee = allEmployees.find(e => e.id === employeeId);
      if (!employee) throw new Error('Employee not found');
      
      // Delete the user through the admin function
      const { data, error } = await supabase.functions.invoke('admin-user-delete', {
        body: {
          userId: employeeId
        }
      });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      toast({
        title: t('employees.employeeDeleted'),
        description: t('employees.employeeDeletedMsg', { name: employee.name })
      });
      
      // Refresh the employees list
      await refreshEmployees();
      
      return true;
    } catch (err) {
      console.error('Error deleting employee:', err);
      
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('employees.deleteError'),
        variant: 'destructive',
      });
      
      return false;
    }
  };

  return {
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeLeave,
    updateEmployeeLeaveStatusFromVacations
  };
};
