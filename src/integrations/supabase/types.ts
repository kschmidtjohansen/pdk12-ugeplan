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
      assignments: {
        Row: {
          assignment_date: string
          car_id: string | null
          car_ids: string[] | null
          created_at: string
          description: string | null
          from_time: string
          id: string
          location: string
          published: boolean | null
          responsible_user_id: string | null
          title: string
          to_time: string
          type: Database["public"]["Enums"]["assignment_type"] | null
          updated_at: string
        }
        Insert: {
          assignment_date: string
          car_id?: string | null
          car_ids?: string[] | null
          created_at?: string
          description?: string | null
          from_time: string
          id?: string
          location: string
          published?: boolean | null
          responsible_user_id?: string | null
          title: string
          to_time: string
          type?: Database["public"]["Enums"]["assignment_type"] | null
          updated_at?: string
        }
        Update: {
          assignment_date?: string
          car_id?: string | null
          car_ids?: string[] | null
          created_at?: string
          description?: string | null
          from_time?: string
          id?: string
          location?: string
          published?: boolean | null
          responsible_user_id?: string | null
          title?: string
          to_time?: string
          type?: Database["public"]["Enums"]["assignment_type"] | null
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
          {
            foreignKeyName: "assignments_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments_employees: {
        Row: {
          assignment_id: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_employees_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          car_number: string
          created_at: string
          fuel_card_code: string
          has_trailer_hitch: boolean | null
          id: string
          is_available: boolean
          name: string
          notes: string | null
          number_plate: string
          updated_at: string
        }
        Insert: {
          car_number: string
          created_at?: string
          fuel_card_code: string
          has_trailer_hitch?: boolean | null
          id?: string
          is_available?: boolean
          name: string
          notes?: string | null
          number_plate: string
          updated_at?: string
        }
        Update: {
          car_number?: string
          created_at?: string
          fuel_card_code?: string
          has_trailer_hitch?: boolean | null
          id?: string
          is_available?: boolean
          name?: string
          notes?: string | null
          number_plate?: string
          updated_at?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          message: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          message: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
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
          avatar_url?: string | null
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
          avatar_url?: string | null
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
      system_cleanup_tracking: {
        Row: {
          cleanup_type: string
          created_at: string
          id: string
          last_run_date: string
          updated_at: string
        }
        Insert: {
          cleanup_type: string
          created_at?: string
          id?: string
          last_run_date: string
          updated_at?: string
        }
        Update: {
          cleanup_type?: string
          created_at?: string
          id?: string
          last_run_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vacations: {
        Row: {
          created_at: string
          end_date: string
          end_time: string | null
          id: string
          is_same_day: boolean | null
          notes: string | null
          reason: string | null
          request_type: string | null
          start_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["vacation_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          end_time?: string | null
          id?: string
          is_same_day?: boolean | null
          notes?: string | null
          reason?: string | null
          request_type?: string | null
          start_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["vacation_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          end_time?: string | null
          id?: string
          is_same_day?: boolean | null
          notes?: string | null
          reason?: string | null
          request_type?: string | null
          start_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["vacation_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_assignment: {
        Args: { assignment_id: string }
        Returns: boolean
      }
      can_user_access_assignment: {
        Args: { assignment_id: string; user_id: string }
        Returns: boolean
      }
      check_system_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      delete_expired_approved_vacations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_old_rejected_vacations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role: {
        Args: { uid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role_safe: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin_or_skadeleder: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_strong_password: {
        Args: { password: string }
        Returns: boolean
      }
      is_valid_email: {
        Args: { email: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          event_type: string
          event_message: string
          event_details?: Json
        }
        Returns: undefined
      }
      log_security_event_safe: {
        Args: {
          event_type: string
          event_message: string
          event_details?: Json
          severity?: string
        }
        Returns: undefined
      }
      log_vacation_security_event: {
        Args: { event_type: string; vacation_id: string; details?: Json }
        Returns: undefined
      }
      sanitize_text_input: {
        Args: { input_text: string; max_length?: number }
        Returns: string
      }
      validate_email_format_enhanced: {
        Args: { email: string }
        Returns: boolean
      }
    }
    Enums: {
      assignment_type: "waterDamage" | "fireDamage" | "mold" | "other"
      user_role: "administrator" | "skadeleder" | "servicemedarbejder"
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
      assignment_type: ["waterDamage", "fireDamage", "mold", "other"],
      user_role: ["administrator", "skadeleder", "servicemedarbejder"],
      vacation_status: ["pending", "approved", "rejected"],
    },
  },
} as const
