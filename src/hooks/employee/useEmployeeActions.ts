
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Vacation } from '@/types/vacation';

export const useEmployeeActions = (fetchEmployees: () => void) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Create a new employee in the database
  const createEmployee = useCallback(async (employeeData: any) => {
    try {
      // This is just a mock implementation - in a real app, this would make an API call
      console.log('Creating employee:', employeeData);
      
      toast({
        title: t('employees.employeeCreated'),
        description: t('employees.employeeCreatedDesc', { name: employeeData.name })
      });
      
      fetchEmployees();
      return true;
    } catch (error) {
      console.error('Error creating employee:', error);
      toast({
        title: t('common.error'),
        description: t('employees.errorCreatingEmployee'),
        variant: 'destructive'
      });
      return false;
    }
  }, [t, toast, fetchEmployees]);

  // Update an existing employee in the database
  const updateEmployee = useCallback(async (employeeId: string, employeeData: any) => {
    try {
      // This is just a mock implementation - in a real app, this would make an API call
      console.log('Updating employee:', employeeId, employeeData);
      
      toast({
        title: t('employees.employeeUpdated'),
        description: t('employees.employeeUpdatedDesc', { name: employeeData.name })
      });
      
      fetchEmployees();
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: t('common.error'),
        description: t('employees.errorUpdatingEmployee'),
        variant: 'destructive'
      });
      return false;
    }
  }, [t, toast, fetchEmployees]);

  // Delete an employee from the database
  const deleteEmployee = useCallback(async (employeeId: string, employees: any[]) => {
    try {
      // This is just a mock implementation - in a real app, this would make an API call
      const employeeToDelete = employees.find(e => e.id === employeeId);
      console.log('Deleting employee:', employeeId);
      
      toast({
        title: t('employees.employeeDeleted'),
        description: t('employees.employeeDeletedDesc', { name: employeeToDelete?.name || employeeId })
      });
      
      fetchEmployees();
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: t('common.error'),
        description: t('employees.errorDeletingEmployee'),
        variant: 'destructive'
      });
      return false;
    }
  }, [t, toast, fetchEmployees]);

  // Toggle an employee's leave status
  const toggleEmployeeLeave = useCallback(async (employee: any, employees: any[]) => {
    try {
      // This is just a mock implementation - in a real app, this would make an API call
      console.log('Toggling employee leave status:', employee.id, !employee.onLeave);
      
      toast({
        title: employee.onLeave ? t('employees.employeeBackFromLeave') : t('employees.employeeOnLeave'),
        description: t(employee.onLeave ? 'employees.employeeBackFromLeaveDesc' : 'employees.employeeOnLeaveDesc', { name: employee.name })
      });
      
      fetchEmployees();
      return true;
    } catch (error) {
      console.error('Error toggling employee leave status:', error);
      toast({
        title: t('common.error'),
        description: t('employees.errorTogglingLeaveStatus'),
        variant: 'destructive'
      });
      return false;
    }
  }, [t, toast, fetchEmployees]);

  // Update employee leave status based on active vacations
  const updateEmployeeLeaveStatusFromVacations = useCallback(async (employees: any[], vacations: Vacation[]) => {
    try {
      // Check for active vacations and update employee status accordingly
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find all approved vacations that are currently active
      const activeVacations = vacations.filter(vacation => {
        if (vacation.status !== 'approved') return false;
        
        const startDate = new Date(vacation.startDate);
        const endDate = new Date(vacation.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        return today >= startDate && today <= endDate;
      });
      
      console.log(`Found ${activeVacations.length} active vacations to update employee status`);
      
      // Update employee leave status based on active vacations
      if (activeVacations.length > 0) {
        // In a real app, this would make API calls to update the employees
        console.log('Employees with active vacations:', activeVacations.map(v => v.employeeId));
        fetchEmployees();
      }
      
      return true;
    } catch (error) {
      console.error('Error updating employee leave status from vacations:', error);
      return false;
    }
  }, [fetchEmployees]);

  return {
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeLeave,
    updateEmployeeLeaveStatusFromVacations
  };
};
