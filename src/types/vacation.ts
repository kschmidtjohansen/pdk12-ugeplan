
export interface Vacation {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  request_type: 'full_day' | 'partial_day';
  start_time?: string;
  end_time?: string;
  is_same_day: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export type VacationStatus = 'pending' | 'approved' | 'rejected';
export type VacationRequestType = 'full_day' | 'partial_day';
