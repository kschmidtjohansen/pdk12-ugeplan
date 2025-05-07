
export type UserRole = 'administrator' | 'skadeleder' | 'servicemedarbejder';

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  phone?: string;
  job_title?: string;
}

export interface UserInsert {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  created_at?: string;
  phone?: string;
  job_title?: string;
}

export interface UserUpdate {
  id?: string;
  email?: string;
  name?: string;
  role?: UserRole;
  created_at?: string;
  phone?: string;
  job_title?: string;
}
