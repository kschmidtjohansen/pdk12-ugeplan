
import { useState } from 'react';
import { Employee } from '@/types/employee';
import { UserRole } from '@/context/AuthContext';
import { getEffectiveRole } from '@/utils/roleHierarchy';

export interface EmployeeFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  jobTitle: string;
  role: UserRole;
  roles: UserRole[];
  onLeave: boolean;
  notes: string;
  is_temporary: boolean;
  expires_at: string;
  has_asbestos_certificate: boolean;
  has_pcb_certificate: boolean;
  has_trailer_license: boolean;
  has_forklift_license: boolean;
  home_postcode: string;
  home_address: string;
  skip_department: boolean;
  sub_department_id: string | null;
}

export type CreationType = 'employee' | 'vikar' | 'edit';

const baseDefaults = (): EmployeeFormData => ({
  name: '',
  email: '',
  password: '',
  phone: '',
  jobTitle: '',
  role: 'servicemedarbejder',
  roles: ['servicemedarbejder'],
  onLeave: false,
  notes: '',
  is_temporary: false,
  expires_at: '',
  has_asbestos_certificate: false,
  has_pcb_certificate: false,
  has_trailer_license: false,
  has_forklift_license: false,
  home_postcode: '',
  home_address: '',
  skip_department: false,
  sub_department_id: null,
});

export const useEmployeeFormState = () => {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [creationType, setCreationType] = useState<CreationType>('employee');
  const [formData, setFormData] = useState<EmployeeFormData>(baseDefaults());

  const prepareForCreate = () => {
    setCurrentEmployee(null);
    setCreationType('employee');
    const d = baseDefaults();
    setFormData(d);
    return d;
  };

  const prepareForEdit = (employee: Employee) => {
    setCurrentEmployee(employee);
    setCreationType('edit');
    const empRoles = (employee.roles && employee.roles.length
      ? employee.roles
      : [employee.role]) as UserRole[];
    const newFormData: EmployeeFormData = {
      ...baseDefaults(),
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      jobTitle: employee.jobTitle || '',
      role: getEffectiveRole(empRoles),
      roles: empRoles,
      onLeave: employee.onLeave || false,
      notes: employee.notes || '',
      is_temporary: employee.is_temporary || false,
      expires_at: employee.expires_at ? new Date(employee.expires_at).toISOString().split('T')[0] : '',
      has_asbestos_certificate: employee.has_asbestos_certificate || false,
      has_pcb_certificate: employee.has_pcb_certificate || false,
      has_trailer_license: employee.has_trailer_license || false,
      has_forklift_license: employee.has_forklift_license || false,
      home_postcode: employee.home_postcode || '',
      home_address: employee.home_address || '',
    };
    setFormData(newFormData);
    return newFormData;
  };

  const prepareForCreateVikar = () => {
    setCurrentEmployee(null);
    setCreationType('vikar');
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    const vikarFormData: EmployeeFormData = {
      ...baseDefaults(),
      role: 'vikar',
      roles: ['vikar'],
      is_temporary: true,
      expires_at: expirationDate.toISOString().split('T')[0],
    };
    setFormData(vikarFormData);
    return vikarFormData;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Legacy single-role setter — also resets the roles array to that single role.
  const handleSelectChange = (value: string) => {
    const role = value as UserRole;
    setFormData(prev => ({ ...prev, role, roles: [role] }));
  };

  // Multi-role toggle. Always keeps at least one role and re-derives the
  // effective `role` as the most privileged in the set.
  const handleRoleToggle = (role: UserRole, checked: boolean) => {
    setFormData(prev => {
      let next = checked
        ? Array.from(new Set([...(prev.roles || []), role]))
        : (prev.roles || []).filter(r => r !== role);
      if (next.length === 0) next = [prev.role];
      const effective = getEffectiveRole(next as UserRole[]);
      return { ...prev, roles: next as UserRole[], role: effective };
    });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
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
    handleRoleToggle,
    handleCheckboxChange
  };
};
