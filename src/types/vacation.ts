
export interface Vacation {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  notes?: string;
  request_type?: 'full_day' | 'partial_day';
  is_same_day?: boolean;
  created_at?: string;
  updated_at?: string;
}
