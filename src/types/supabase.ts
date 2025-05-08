
import { Database } from '@/integrations/supabase/types';

export type TableCar = Database['public']['Tables']['cars']['Row'];
export type InsertCar = Database['public']['Tables']['cars']['Insert'];
export type UpdateCar = Database['public']['Tables']['cars']['Update'];

export type TableAssignment = Database['public']['Tables']['assignments']['Row'];
export type InsertAssignment = Database['public']['Tables']['assignments']['Insert'];
export type UpdateAssignment = Database['public']['Tables']['assignments']['Update'];

export type TableProfile = Database['public']['Tables']['profiles']['Row'];
export type InsertProfile = Database['public']['Tables']['profiles']['Insert'];
export type UpdateProfile = Database['public']['Tables']['profiles']['Update'];

export type TableVacation = Database['public']['Tables']['vacations']['Row'];
export type InsertVacation = Database['public']['Tables']['vacations']['Insert'];
export type UpdateVacation = Database['public']['Tables']['vacations']['Update'];

export type TableNotification = Database['public']['Tables']['notifications']['Row'];
export type InsertNotification = Database['public']['Tables']['notifications']['Insert'];
export type UpdateNotification = Database['public']['Tables']['notifications']['Update'];

export type TableAssignmentEmployee = Database['public']['Tables']['assignment_employees']['Row'];
export type InsertAssignmentEmployee = Database['public']['Tables']['assignment_employees']['Insert'];
export type UpdateAssignmentEmployee = Database['public']['Tables']['assignment_employees']['Update'];

export type UserRole = Database['public']['Enums']['user_role'];
