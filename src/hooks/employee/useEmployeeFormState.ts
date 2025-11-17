
import { useState } from 'react';
import { Employee } from '@/types/employee';
import { UserRole } from '@/context/AuthContext';

export interface EmployeeFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  jobTitle: string;
  role: UserRole;
  onLeave: boolean;
  notes: string;
  is_temporary: boolean;
  expires_at: string;
  has_asbestos_certificate: boolean;
  has_trailer_license: boolean;
  has_drivers_license: boolean;
}

export type CreationType = 'employee' | 'vikar' | 'edit';

export const useEmployeeFormState = () => {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [creationType, setCreationType] = useState<CreationType>('employee');
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    jobTitle: '',
    role: 'servicemedarbejder',
    onLeave: false,
    notes: '',
    is_temporary: false,
    expires_at: '',
    has_asbestos_certificate: false,
    has_trailer_license: false,
    has_drivers_license: false
  });

  const resetFormData = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      jobTitle: '',
      role: 'servicemedarbejder',
      onLeave: false,
      notes: '',
      is_temporary: false,
      expires_at: '',
      has_asbestos_certificate: false,
      has_trailer_license: false,
      has_drivers_license: false
    });
  };

  const prepareForCreate = () => {
    setCurrentEmployee(null);
    setCreationType('employee');
    resetFormData();
    return formData;
  };

  const prepareForEdit = (employee: Employee) => {
    setCurrentEmployee(employee);
    setCreationType('edit');
    setFormData({
      name: employee.name,
      email: employee.email,
      password: '',
      phone: employee.phone || '',
      jobTitle: employee.jobTitle || '',
      role: employee.role,
      onLeave: employee.onLeave || false,
      notes: employee.notes || '',
      is_temporary: employee.is_temporary || false,
      expires_at: employee.expires_at ? new Date(employee.expires_at).toISOString().split('T')[0] : '',
      has_asbestos_certificate: employee.has_asbestos_certificate || false,
      has_trailer_license: employee.has_trailer_license || false,
      has_drivers_license: employee.has_drivers_license || false
    });
    return formData;
  };

  const prepareForCreateVikar = () => {
    setCurrentEmployee(null);
    setCreationType('vikar');
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now
    
    const vikarFormData = {
      name: '',
      email: '',
      password: '',
      phone: '',
      jobTitle: '',
      role: 'vikar' as UserRole,
      onLeave: false,
      notes: '',
      is_temporary: true,
      expires_at: expirationDate.toISOString().split('T')[0],
      has_asbestos_certificate: false,
      has_trailer_license: false,
      has_drivers_license: false
    };
    
    setFormData(vikarFormData);
    return vikarFormData;
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

  return {
    currentEmployee,
    formData,
    creationType,
    prepareForCreate,
    prepareForEdit,
    prepareForCreateVikar,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange
  };
};
