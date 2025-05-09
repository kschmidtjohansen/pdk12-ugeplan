export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assignment_employees: {
        Row: {
          assignment_id: string
          created_at: string
          employee_id: string
          employee_name: string
          id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          employee_id: string
          employee_name: string
          id?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          employee_id?: string
          employee_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_employees_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          car_id: string | null
          car_name: string | null
          created_at: string
          date: string
          description: string | null
          from_time: string
          id: string
          location: string | null
          published: boolean | null
          title: string
          to_time: string
          updated_at: string
        }
        Insert: {
          car_id?: string | null
          car_name?: string | null
          created_at?: string
          date: string
          description?: string | null
          from_time: string
          id?: string
          location?: string | null
          published?: boolean | null
          title: string
          to_time: string
          updated_at?: string
        }
        Update: {
          car_id?: string | null
          car_name?: string | null
          created_at?: string
          date?: string
          description?: string | null
          from_time?: string
          id?: string
          location?: string | null
          published?: boolean | null
          title?: string
          to_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          car_number: string | null
          created_at: string
          fuel_card_code: string | null
          has_trailer_hitch: boolean | null
          id: string
          name: string
          number_plate: string | null
          updated_at: string
        }
        Insert: {
          car_number?: string | null
          created_at?: string
          fuel_card_code?: string | null
          has_trailer_hitch?: boolean | null
          id?: string
          name: string
          number_plate?: string | null
          updated_at?: string
        }
        Update: {
          car_number?: string | null
          created_at?: string
          fuel_card_code?: string | null
          has_trailer_hitch?: boolean | null
          id?: string
          name?: string
          number_plate?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          job_title: string | null
          name: string
          notes: string | null
          on_leave: boolean | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          job_title?: string | null
          name: string
          notes?: string | null
          on_leave?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          job_title?: string | null
          name?: string
          notes?: string | null
          on_leave?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vacations: {
        Row: {
          created_at: string
          employee_id: string
          employee_name: string
          end_date: string
          id: string
          notes: string | null
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["vacation_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          employee_name: string
          end_date: string
          id?: string
          notes?: string | null
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["vacation_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          employee_name?: string
          end_date?: string
          id?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["vacation_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { p_user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: { user_id: string; role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin_or_skadeleder: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "administrator" | "skadeleder" | "servicemedarbejder"
      vacation_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["administrator", "skadeleder", "servicemedarbejder"],
      vacation_status: ["pending", "approved", "rejected"],
    },
  },
} as const
