
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/employee';
import { UserRole } from '@/context/AuthContext';

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
  const [isLoading, setIsLoading] = useState(true);
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

  // Fetch employees when the hook mounts
  useEffect(() => {
    fetchEmployees();

    // Set up real-time subscription for employee updates
    const employeeSubscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        fetchEmployees
      )
      .subscribe();

    return () => {
      employeeSubscription.unsubscribe();
    };
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        throw profilesError;
      }

      // Fetch roles for each profile
      const employeesWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          if (rolesError) {
            console.error("Error fetching roles:", rolesError);
          }

          // Determine primary role (administrator > skadeleder > servicemedarbejder)
          let primaryRole: UserRole = "servicemedarbejder";
          if (userRoles && userRoles.length > 0) {
            const roles = userRoles.map(r => r.role);
            if (roles.includes("administrator")) {
              primaryRole = "administrator";
            } else if (roles.includes("skadeleder")) {
              primaryRole = "skadeleder";
            }
          }

          return {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone || '',
            jobTitle: profile.job_title || '',
            role: primaryRole,
            onLeave: profile.on_leave || false,
            notes: profile.notes || ''
          } as Employee;
        })
      );

      setEmployees(employeesWithRoles);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: t("common.error"),
        description: t("employees.fetchError"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      // First, create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        email_confirm: true,
        user_metadata: {
          name: formData.name,
          phone: formData.phone,
          job_title: formData.jobTitle
        },
        password: "temporaryPassword123!", // Temporary password that should be changed
      });

      if (authError) {
        throw authError;
      }

      // Update the profile with additional information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          notes: formData.notes,
          on_leave: formData.onLeave
        })
        .eq('id', authData.user.id);

      if (profileError) {
        throw profileError;
      }

      // Add role to the user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: formData.role
        });

      if (roleError) {
        throw roleError;
      }

      toast({
        title: t("employees.employeeAdded"),
        description: t("employees.employeeAddedMsg", {
          name: formData.name
        })
      });

      // Refresh employee list
      fetchEmployees();
    } catch (error) {
      console.error("Error creating employee:", error);
      toast({
        title: t("common.error"),
        description: t("employees.createError"),
        variant: "destructive"
      });
    }
  };

  const updateEmployee = async () => {
    if (!currentEmployee) return;
    
    try {
      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          job_title: formData.jobTitle,
          on_leave: formData.onLeave,
          notes: formData.notes
        })
        .eq('id', currentEmployee.id);

      if (profileError) {
        throw profileError;
      }

      // If role has changed, update the role
      if (formData.role !== currentEmployee.role) {
        // First delete current roles
        const { error: deleteRoleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', currentEmployee.id);

        if (deleteRoleError) {
          throw deleteRoleError;
        }

        // Then add new role
        const { error: addRoleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: currentEmployee.id,
            role: formData.role
          });

        if (addRoleError) {
          throw addRoleError;
        }
      }

      toast({
        title: t("employees.employeeUpdated"),
        description: t("employees.employeeUpdatedMsg", {
          name: formData.name
        })
      });

      // Refresh employee list
      fetchEmployees();
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        title: t("common.error"),
        description: t("employees.updateError"),
        variant: "destructive"
      });
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    try {
      // In Supabase, deleting the user in auth will cascade to the profiles table
      const { error } = await supabase.auth.admin.deleteUser(employeeId);

      if (error) {
        throw error;
      }

      const employeeToDelete = employees.find(e => e.id === employeeId);
      
      if (employeeToDelete) {
        toast({
          title: t("employees.employeeDeleted"),
          description: t("employees.employeeDeletedMsg", { name: employeeToDelete.name })
        });
      }

      // Refresh employee list
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: t("common.error"),
        description: t("employees.deleteError"),
        variant: "destructive"
      });
    }
  };

  const toggleEmployeeLeave = async (employee: Employee) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ on_leave: !employee.onLeave })
        .eq('id', employee.id);

      if (error) {
        throw error;
      }
      
      toast({
        title: employee.onLeave 
          ? t("employees.employeeAvailable") 
          : t("employees.employeeOnLeave"),
        description: employee.onLeave 
          ? t("employees.employeeAvailableMsg", { name: employee.name }) 
          : t("employees.employeeOnLeaveMsg", { name: employee.name })
      });

      // Refresh employee list
      fetchEmployees();
    } catch (error) {
      console.error("Error toggling leave status:", error);
      toast({
        title: t("common.error"),
        description: t("employees.updateError"),
        variant: "destructive"
      });
    }
  };

  return {
    employees,
    isLoading,
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
    fetchEmployees
  };
};
