
export interface AssignmentRow {
  id: string;
  title: string;
  description: string;
  date: string;
  from_time: string;
  to_time: string;
  location: string;
  car_id: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignmentInsert {
  id?: string;
  title: string;
  description: string;
  date: string;
  from_time: string;
  to_time: string;
  location: string;
  car_id: string;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AssignmentUpdate {
  id?: string;
  title?: string;
  description?: string;
  date?: string;
  from_time?: string;
  to_time?: string;
  location?: string;
  car_id?: string;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AssignmentEmployeeRow {
  id: string;
  assignment_id: string;
  employee_id: string;
}

export interface AssignmentEmployeeInsert {
  id?: string;
  assignment_id: string;
  employee_id: string;
}

export interface AssignmentEmployeeUpdate {
  id?: string;
  assignment_id?: string;
  employee_id?: string;
}
