
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { UserRole } from '@/context/AuthContext';

// Initial employee data
const initialEmployees: Employee[] = [{
  id: '1',
  name: 'John Doe',
  email: 'john.doe@polygon.com',
  phone: '+45 12 34 56 78',
  jobTitle: 'Senior Technician',
  role: 'skadeleder',
  onLeave: false,
  notes: 'Experienced team leader with 10+ years in the field.'
}, {
  id: '2',
  name: 'Jane Smith',
  email: 'jane.smith@polygon.com',
  phone: '+45 23 45 67 89',
  jobTitle: 'Technician',
  role: 'servicemedarbejder',
  onLeave: true,
  notes: 'Specializes in water damage assessment.'
}, {
  id: '3',
  name: 'Mike Johnson',
  email: 'mike.johnson@polygon.com',
  phone: '+45 34 56 78 90',
  jobTitle: 'Project Manager',
  role: 'administrator',
  onLeave: false,
  notes: 'Main system administrator and project coordinator.'
}, {
  id: '4',
  name: 'Anna Williams',
  email: 'anna.williams@polygon.com',
  phone: '+45 45 67 89 01',
  jobTitle: 'Junior Technician',
  role: 'servicemedarbejder',
  onLeave: false,
  notes: 'New team member, currently in training.'
}];

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
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
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

  const createEmployee = () => {
    const newEmployee: Employee = {
      ...formData,
      id: Date.now().toString()
    };
    setEmployees([...employees, newEmployee]);
    toast({
      title: t("employees.employeeAdded"),
      description: t("employees.employeeAddedMsg", {
        name: formData.name
      })
    });
  };

  const updateEmployee = () => {
    if (!currentEmployee) return;
    
    setEmployees(employees.map(e => e.id === currentEmployee.id ? {
      ...e,
      ...formData
    } : e));
    
    toast({
      title: t("employees.employeeUpdated"),
      description: t("employees.employeeUpdatedMsg", {
        name: formData.name
      })
    });
  };

  const deleteEmployee = (employeeId: string) => {
    setEmployees(employees.filter(e => e.id !== employeeId));
    const employeeToDelete = employees.find(e => e.id === employeeId);
    
    if (employeeToDelete) {
      toast({
        title: t("employees.employeeDeleted"),
        description: t("employees.employeeDeletedMsg", { name: employeeToDelete.name })
      });
    }
  };

  const toggleEmployeeLeave = (employee: Employee) => {
    setEmployees(employees.map(e => 
      e.id === employee.id ? {...e, onLeave: !e.onLeave} : e
    ));
    
    toast({
      title: employee.onLeave 
        ? t("employees.employeeAvailable") 
        : t("employees.employeeOnLeave"),
      description: employee.onLeave 
        ? t("employees.employeeAvailableMsg", { name: employee.name }) 
        : t("employees.employeeOnLeaveMsg", { name: employee.name })
    });
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
    toggleEmployeeLeave
  };
};
