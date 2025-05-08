
import { UserRole as SupabaseUserRole } from './supabase';

// Export User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Re-export UserRole type from supabase
export type UserRole = SupabaseUserRole;

// Extended user interface with employee fields
export interface UserWithProfile extends User {
  phone?: string;
  jobTitle?: string;
  onLeave?: boolean;
  notes?: string;
}
