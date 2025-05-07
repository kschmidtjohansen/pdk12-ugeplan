
import { Database } from '../../types/supabaseTypes';

export type Assignment = Database['public']['Tables']['assignments']['Row'];
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];
export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update'];
export type AssignmentEmployee = Database['public']['Tables']['assignment_employees']['Row'];

export interface AssignmentWithEmployees extends Assignment {
  employees: string[];
}

export interface AssignmentEmployeeRelation {
  assignment_id: string;
  employee_id: string;
}
