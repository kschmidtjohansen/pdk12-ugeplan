
import { Json } from '../../integrations/supabase/types';
import {
  UserRow,
  UserInsert,
  UserUpdate
} from './userTypes';

import {
  EmployeeRow,
  EmployeeInsert,
  EmployeeUpdate
} from './employeeTypes';

import {
  CarRow,
  CarInsert,
  CarUpdate
} from './carTypes';

import {
  VacationRow,
  VacationInsert,
  VacationUpdate
} from './vacationTypes';

import {
  AssignmentRow,
  AssignmentInsert,
  AssignmentUpdate,
  AssignmentEmployeeRow,
  AssignmentEmployeeInsert,
  AssignmentEmployeeUpdate
} from './assignmentTypes';

import {
  NotificationRow,
  NotificationInsert,
  NotificationUpdate
} from './notificationTypes';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      employees: {
        Row: EmployeeRow;
        Insert: EmployeeInsert;
        Update: EmployeeUpdate;
      };
      cars: {
        Row: CarRow;
        Insert: CarInsert;
        Update: CarUpdate;
      };
      vacations: {
        Row: VacationRow;
        Insert: VacationInsert;
        Update: VacationUpdate;
      };
      assignments: {
        Row: AssignmentRow;
        Insert: AssignmentInsert;
        Update: AssignmentUpdate;
      };
      assignment_employees: {
        Row: AssignmentEmployeeRow;
        Insert: AssignmentEmployeeInsert;
        Update: AssignmentEmployeeUpdate;
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
