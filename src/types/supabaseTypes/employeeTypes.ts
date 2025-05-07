
import { UserRole } from './userTypes';

export interface EmployeeRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  job_title: string;
  role: UserRole;
  on_leave: boolean;
  notes: string | null;
  created_at: string;
}

export interface EmployeeInsert {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  job_title: string;
  role: UserRole;
  on_leave?: boolean;
  notes?: string | null;
  created_at?: string;
}

export interface EmployeeUpdate {
  id?: string;
  user_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  job_title?: string;
  role?: UserRole;
  on_leave?: boolean;
  notes?: string | null;
  created_at?: string;
}
