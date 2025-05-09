
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { UserRole } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

  // Fetch employees from Supabase
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Join profiles with user_roles to get all employee data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          phone,
          job_title,
          on_leave,
          notes,
          user_roles!inner (role)
        `)
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const formattedEmployees: Employee[] = data.map(item => ({
          id: item.id,
          name: item.name,
          email: item.email,
          phone: item.phone || '',
          jobTitle: item.job_title || '',
          role: item.user_roles.role as UserRole,
          onLeave: item.on_leave || false,
          notes: item.notes || ''
        }));
        
        setEmployees(formattedEmployees);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      toast({
        title: t('common.error'),
        description: t('employees.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

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
      // First create the user with auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: generateRandomPassword(), // You would implement this function
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
      fetchEmployees();
      
      toast({
        title: t("employees.employeeAdded"),
        description: t("employees.employeeAddedMsg", {
          name: formData.name
        })
      });
    } catch (err) {
      console.error('Error creating employee:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error creating employee',
        variant: 'destructive',
      });
    }
  };

  const updateEmployee = async () => {
    if (!currentEmployee) return;
    
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
      fetchEmployees();
      
      toast({
        title: t("employees.employeeUpdated"),
        description: t("employees.employeeUpdatedMsg", {
          name: formData.name
        })
      });
    } catch (err) {
      console.error('Error updating employee:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error updating employee',
        variant: 'destructive',
      });
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    try {
      // Find employee before deletion for the toast message
      const employeeToDelete = employees.find(e => e.id === employeeId);
      
      // Delete the user through the auth API
      const { error } = await supabase.auth.admin.deleteUser(employeeId);
      
      if (error) throw error;
      
      // Remove from local state
      setEmployees(employees.filter(e => e.id !== employeeId));
      
      if (employeeToDelete) {
        toast({
          title: t("employees.employeeDeleted"),
          description: t("employees.employeeDeletedMsg", { name: employeeToDelete.name })
        });
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error deleting employee',
        variant: 'destructive',
      });
    }
  };

  const toggleEmployeeLeave = async (employee: Employee) => {
    try {
      const newLeaveStatus = !employee.onLeave;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          on_leave: newLeaveStatus
        })
        .eq('id', employee.id);
      
      if (error) throw error;
      
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
    } catch (err) {
      console.error('Error toggling employee leave status:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error updating leave status',
        variant: 'destructive',
      });
    }
  };

  // Utility function to generate a random password
  const generateRandomPassword = () => {
    // Generate a random string of 12 characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  return {
    employees,
    loading,
    error,
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
    toggleEmployeeLeave
  };
};
