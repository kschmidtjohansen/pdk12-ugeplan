
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'administrator' | 'skadeleder' | 'servicemedarbejder';
          created_at: string;
          phone?: string;
          job_title?: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'administrator' | 'skadeleder' | 'servicemedarbejder';
          created_at?: string;
          phone?: string;
          job_title?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'administrator' | 'skadeleder' | 'servicemedarbejder';
          created_at?: string;
          phone?: string;
          job_title?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string;
          job_title: string;
          role: 'administrator' | 'skadeleder' | 'servicemedarbejder';
          on_leave: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          phone: string;
          job_title: string;
          role: 'administrator' | 'skadeleder' | 'servicemedarbejder';
          on_leave?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          job_title?: string;
          role?: 'administrator' | 'skadeleder' | 'servicemedarbejder';
          on_leave?: boolean;
          notes?: string | null;
          created_at?: string;
        };
      };
      cars: {
        Row: {
          id: string;
          name: string;
          car_number: string;
          number_plate: string;
          fuel_card_code: string;
          has_trailer_hitch: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          car_number: string;
          number_plate: string;
          fuel_card_code: string;
          has_trailer_hitch?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          car_number?: string;
          number_plate?: string;
          fuel_card_code?: string;
          has_trailer_hitch?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      vacations: {
        Row: {
          id: string;
          employee_id: string;
          start_date: string;
          end_date: string;
          reason: string;
          status: 'pending' | 'approved' | 'rejected';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          start_date: string;
          end_date: string;
          reason: string;
          status: 'pending' | 'approved' | 'rejected';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          start_date?: string;
          end_date?: string;
          reason?: string;
          status?: 'pending' | 'approved' | 'rejected';
          notes?: string | null;
          created_at?: string;
        };
      };
      assignments: {
        Row: {
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
        };
        Insert: {
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
        };
        Update: {
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
        };
      };
      assignment_employees: {
        Row: {
          id: string;
          assignment_id: string;
          employee_id: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          employee_id: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          employee_id?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
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
