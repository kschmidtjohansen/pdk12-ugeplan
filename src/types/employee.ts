
import { UserRole } from '@/context/AuthContext';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: UserRole;
  onLeave?: boolean;
  notes?: string;
  onApprovedVacation?: boolean;
  avatar_url?: string;
}
