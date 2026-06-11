export type DutyType = 'skadeleder_vagt' | 'kørevagt';

export interface Duty {
  id: string;
  duty_date: string;
  duty_type: DutyType;
  employee_id: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    role?: 'super_admin' | 'administrator' | 'skadeleder' | 'servicemedarbejder' | 'fugttekniker' | 'vikar';
  };
}

export interface DutyFormData {
  duty_type: DutyType;
  employee_id: string;
  dates: Date[];
  notes: string;
}
