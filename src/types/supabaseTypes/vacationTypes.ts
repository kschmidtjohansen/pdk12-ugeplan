
export interface VacationRow {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
}

export interface VacationInsert {
  id?: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string | null;
  created_at?: string;
}

export interface VacationUpdate {
  id?: string;
  employee_id?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  status?: 'pending' | 'approved' | 'rejected';
  notes?: string | null;
  created_at?: string;
}
