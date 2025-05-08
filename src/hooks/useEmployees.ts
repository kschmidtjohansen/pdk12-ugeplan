
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { UserRole } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TableProfile } from '@/types/supabase';

export interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: UserRole;
  onLeave: boolean;
  notes: string;
}

export const useEmployees = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    role: 'servicemedarbejder',
    onLeave: false,
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch employees from Supabase
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*');

        if (error) {
          throw error;
        }

        // Transform profile data to match our Employee interface
        const transformedEmployees: Employee[] = data.map((profile: TableProfile) => ({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: profile.role,
          onLeave: profile.on_leave,
          notes: profile.notes || ''
        }));

        setEmployees(transformedEmployees);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: t('common.error'),
          description: t('employees.fetchError'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [toast, t]);

  const resetFormData = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      role: 'servicemedarbejder',
      onLeave: false,
      notes: ''
    });
  };

  const prepareForCreate = () => {
    setCurrentEmployee(null);
    resetFormData();
    return formData;
  };

  const prepareForEdit = (employee: Employee) => {
    setCurrentEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      jobTitle: employee.jobTitle,
      role: employee.role,
      onLeave: employee.onLeave || false,
      notes: employee.notes || ''
    });
    return formData;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as UserRole
    }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const createEmployee = async () => {
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

      // Add the new employee to the state
      const newEmployee: Employee = {
        id: authData.user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        jobTitle: formData.jobTitle,
        role: formData.role,
        onLeave: formData.onLeave,
        notes: formData.notes
      };

      setEmployees([...employees, newEmployee]);

      toast({
        title: t("employees.employeeAdded"),
        description: t("employees.employeeAddedMsg", {
          name: formData.name
        })
      });

      return newEmployee;
    } catch (error) {
      console.error('Error creating employee:', error);
      toast({
        title: t('common.error'),
        description: t('employees.createError'),
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateEmployee = async () => {
    if (!currentEmployee) return;
    
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
        .eq('id', currentEmployee.id);

      if (error) {
        throw error;
      }

      // Update local state
      setEmployees(employees.map(e => e.id === currentEmployee.id ? {
        ...e,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        jobTitle: formData.jobTitle,
        role: formData.role,
        onLeave: formData.onLeave,
        notes: formData.notes
      } : e));
      
      toast({
        title: t("employees.employeeUpdated"),
        description: t("employees.employeeUpdatedMsg", {
          name: formData.name
        })
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: t('common.error'),
        description: t('employees.updateError'),
        variant: "destructive",
      });
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    try {
      const employeeToDelete = employees.find(e => e.id === employeeId);
      if (!employeeToDelete) return;
      
      // Delete user in auth (will cascade delete profile due to foreign key)
      const { error } = await supabase.auth.admin.deleteUser(employeeId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setEmployees(employees.filter(e => e.id !== employeeId));
      
      toast({
        title: t("employees.employeeDeleted"),
        description: t("employees.employeeDeletedMsg", { name: employeeToDelete.name })
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: t('common.error'),
        description: t('employees.deleteError'),
        variant: "destructive",
      });
    }
  };

  const toggleEmployeeLeave = async (employee: Employee) => {
    try {
      const newLeaveStatus = !employee.onLeave;
      
      // Update in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ on_leave: newLeaveStatus })
        .eq('id', employee.id);

      if (error) {
        throw error;
      }
      
      // Update local state
      setEmployees(employees.map(e => 
        e.id === employee.id ? {...e, onLeave: newLeaveStatus} : e
      ));
      
      toast({
        title: newLeaveStatus 
          ? t("employees.employeeOnLeave")
          : t("employees.employeeAvailable"),
        description: newLeaveStatus 
          ? t("employees.employeeOnLeaveMsg", { name: employee.name }) 
          : t("employees.employeeAvailableMsg", { name: employee.name })
      });
    } catch (error) {
      console.error('Error toggling employee leave status:', error);
      toast({
        title: t('common.error'),
        description: t('employees.updateError'),
        variant: "destructive",
      });
    }
  };

  return {
    employees,
    currentEmployee,
    formData,
    prepareForCreate,
    prepareForEdit,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeLeave,
    isLoading
  };
};
