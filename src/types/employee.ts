
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  role: 'administrator' | 'skadeleder' | 'servicemedarbejder';
  onLeave?: boolean; // Keep for backward compatibility
  status: EmployeeStatus; // New status field
  notes?: string;
  avatar_url?: string;
}
