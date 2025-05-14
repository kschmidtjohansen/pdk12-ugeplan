import { useState } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { EmployeeFormData } from './useEmployeeFormState';

export const useEmployeeActions = (refetchEmployees: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Utility function to generate a random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const createEmployee = async (formData: EmployeeFormData) => {
    try {
      // First create the user with auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: generateRandomPassword(),
        options: {
          data: {
            name: formData.name
          }
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('No user returned from signup');
      }
      
      // Then update the profile with additional info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
          job_title: formData.jobTitle,
          on_leave: formData.onLeave,
          notes: formData.notes
        })
        .eq('id', authData.user.id);
      
      if (profileError) throw profileError;
      
      // Then set the role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({
          role: formData.role
        })
        .eq('user_id', authData.user.id);
      
      if (roleError) throw roleError;
      
      // Refresh the employee list
      await refetchEmployees();
      
      toast({
        title: t("employees.employeeAdded"),
        description: t("employees.employeeAddedMsg", {
          name: formData.name
        })
      });
      
      return true;
    } catch (err) {
      console.error('Error creating employee:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error creating employee',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateEmployee = async (currentEmployee: Employee, formData: EmployeeFormData) => {
    if (!currentEmployee) return false;
    
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          job_title: formData.jobTitle,
          on_leave: formData.onLeave,
          notes: formData.notes
        })
        .eq('id', currentEmployee.id);
      
      if (profileError) throw profileError;
      
      // Update role if it changed
      if (formData.role !== currentEmployee.role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({
            role: formData.role
          })
          .eq('user_id', currentEmployee.id);
        
        if (roleError) throw roleError;
      }
      
      // Refresh the employee list
      await refetchEmployees();
      
      toast({
        title: t("employees.employeeUpdated"),
        description: t("employees.employeeUpdatedMsg", {
          name: formData.name
        })
      });
      
      return true;
    } catch (err) {
      console.error('Error updating employee:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error updating employee',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteEmployee = async (employeeId: string, employees: Employee[]) => {
    try {
      // Find employee before deletion for the toast message
      const employeeToDelete = employees.find(e => e.id === employeeId);
      
      // Call the admin-user-delete edge function
      const { error } = await supabase.functions.invoke('admin-user-delete', {
        body: { userId: employeeId }
      });
      
      if (error) throw error;
      
      // Refresh the employee list
      await refetchEmployees();
      
      if (employeeToDelete) {
        toast({
          title: t("employees.employeeDeleted"),
          description: t("employees.employeeDeletedMsg", { name: employeeToDelete.name })
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting employee:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error deleting employee',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleEmployeeLeave = async (employee: Employee, employees: Employee[]) => {
    try {
      const newLeaveStatus = !employee.onLeave;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          on_leave: newLeaveStatus
        })
        .eq('id', employee.id);
      
      if (error) throw error;
      
      // Refresh the employee list
      await refetchEmployees();
      
      toast({
        title: newLeaveStatus 
          ? t("employees.employeeOnLeave") 
          : t("employees.employeeAvailable"),
        description: newLeaveStatus 
          ? t("employees.employeeOnLeaveMsg", { name: employee.name }) 
          : t("employees.employeeAvailableMsg", { name: employee.name })
      });
      
      return true;
    } catch (err) {
      console.error('Error toggling employee leave status:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error updating leave status',
        variant: 'destructive',
      });
      return false;
    }
  };

  // New function to set employee leave status automatically based on vacations
  const updateEmployeeLeaveStatusFromVacations = async () => {
    try {
      // Get current date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get employees with approved vacations that include today
      const { data: activeVacations, error: vacationError } = await supabase
        .from('vacations')
        .select(`
          user_id,
          start_date,
          end_date
        `)
        .eq('status', 'approved')
        .lte('start_date', today.toISOString().split('T')[0])
        .gte('end_date', today.toISOString().split('T')[0]);
      
      if (vacationError) throw vacationError;
      
      // For each employee with active vacation, set on_leave to true
      if (activeVacations && activeVacations.length > 0) {
        const employeeIds = [...new Set(activeVacations.map(v => v.user_id))];
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ on_leave: true })
          .in('id', employeeIds);
        
        if (updateError) throw updateError;
      }
      
      // For employees with vacations that ended yesterday, set on_leave to false
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: endedVacations, error: endedError } = await supabase
        .from('vacations')
        .select(`
          user_id,
          end_date
        `)
        .eq('status', 'approved')
        .eq('end_date', yesterday.toISOString().split('T')[0]);
      
      if (endedError) throw endedError;
      
      if (endedVacations && endedVacations.length > 0) {
        const employeeIds = [...new Set(endedVacations.map(v => v.user_id))];
        
        // Before setting on_leave to false, check if the employee has any other active vacations
        for (const employeeId of employeeIds) {
          const { data: activeVacations, error: activeError } = await supabase
            .from('vacations')
            .select()
            .eq('user_id', employeeId)
            .eq('status', 'approved')
            .lte('start_date', today.toISOString().split('T')[0])
            .gte('end_date', today.toISOString().split('T')[0]);
            
          if (activeError) throw activeError;
          
          // Only set on_leave to false if the employee has no other active vacations
          if (!activeVacations || activeVacations.length === 0) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ on_leave: false })
              .eq('id', employeeId);
            
            if (updateError) throw updateError;
          }
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error updating employee leave status from vacations:', err);
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
