
import { UserRole } from '@/types/auth';
import { TableProfile } from '@/types/supabase';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: UserRole;
  onLeave?: boolean;
  notes?: string;
}

// Utility function to convert TableProfile to Employee
export function profileToEmployee(profile: TableProfile): Employee {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone || '',
    jobTitle: profile.job_title || '',
    role: profile.role,
    onLeave: profile.on_leave,
    notes: profile.notes || ''
  };
}
