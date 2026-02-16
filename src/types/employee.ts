
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  role: 'super_admin' | 'administrator' | 'skadeleder' | 'servicemedarbejder' | 'vikar';
  onLeave?: boolean; // Keep for backward compatibility
  status: EmployeeStatus; // New status field
  notes?: string;
  avatar_url?: string;
  is_temporary?: boolean;
  expires_at?: string;
  has_asbestos_certificate?: boolean;
  has_trailer_license?: boolean;
  has_forklift_license?: boolean;
  home_postcode?: string;
  home_address?: string;
  lat?: number;
  lng?: number;
}
