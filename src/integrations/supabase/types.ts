export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
            foreignKeyName: "fk_assignments_car_id"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignments_car_id"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignments_car_id"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars_public_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignments_responsible_user_id"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignments_responsible_user_id"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
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
            foreignKeyName: "fk_assignments_employees_assignment_id"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignments_employees_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignments_employees_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
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
      logs_partitioned: {
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
      logs_y2025m07: {
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
      logs_y2025m08: {
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
          status: Database["public"]["Enums"]["employee_status"]
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
          status?: Database["public"]["Enums"]["employee_status"]
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
          status?: Database["public"]["Enums"]["employee_status"]
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
      cars_public: {
        Row: {
          car_number: string | null
          created_at: string | null
          has_trailer_hitch: boolean | null
          id: string | null
          is_available: boolean | null
          name: string | null
          notes: string | null
          number_plate: string | null
          updated_at: string | null
        }
        Insert: {
          car_number?: string | null
          created_at?: string | null
          has_trailer_hitch?: boolean | null
          id?: string | null
          is_available?: boolean | null
          name?: string | null
          notes?: string | null
          number_plate?: string | null
          updated_at?: string | null
        }
        Update: {
          car_number?: string | null
          created_at?: string | null
          has_trailer_hitch?: boolean | null
          id?: string | null
          is_available?: boolean | null
          name?: string | null
          notes?: string | null
          number_plate?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cars_public_safe: {
        Row: {
          car_number: string | null
          created_at: string | null
          has_trailer_hitch: boolean | null
          id: string | null
          is_available: boolean | null
          name: string | null
          notes: string | null
          number_plate: string | null
          updated_at: string | null
        }
        Insert: {
          car_number?: string | null
          created_at?: string | null
          has_trailer_hitch?: boolean | null
          id?: string | null
          is_available?: boolean | null
          name?: string | null
          notes?: string | null
          number_plate?: string | null
          updated_at?: string | null
        }
        Update: {
          car_number?: string | null
          created_at?: string | null
          has_trailer_hitch?: boolean | null
          id?: string | null
          is_available?: boolean | null
          name?: string | null
          notes?: string | null
          number_plate?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string | null
          name: string | null
          status: Database["public"]["Enums"]["employee_status"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles_with_names: {
        Row: {
          created_at: string | null
          id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_system_log: {
        Args: { p_details?: Json; p_event_type: string; p_message: string }
        Returns: string
      }
      apply_logs_rls_policies: {
        Args: { table_name: string }
        Returns: undefined
      }
      can_access_assignment: {
        Args: { assignment_id: string }
        Returns: boolean
      }
      can_user_access_assignment: {
        Args: { assignment_id: string; user_id: string }
        Returns: boolean
      }
      can_view_assignment_optimized: {
        Args: { assignment_id: string; user_id: string }
        Returns: boolean
      }
      check_data_access_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_system_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_logs_partition_for_month: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_expired_approved_vacations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_old_rejected_vacations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      emergency_log_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      ensure_logs_rls_consistency: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      example_function: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      final_database_optimization: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_database_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_enhanced_system_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      is_user_assigned_to_assignment: {
        Args: { assignment_id: string; user_id: string }
        Returns: boolean
      }
      is_valid_email: {
        Args: { email: string }
        Returns: boolean
      }
      log_data_fetch_error_safe: {
        Args: {
          error_message: string
          operation_type: string
          retry_count?: number
          user_id_param?: string
        }
        Returns: undefined
      }
      log_realtime_change_throttled: {
        Args: { operation: string; record_id: string; table_name: string }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          event_details?: Json
          event_message: string
          event_type: string
        }
        Returns: undefined
      }
      log_security_event_optimized: {
        Args: {
          event_details?: Json
          event_message: string
          event_type: string
          severity?: string
        }
        Returns: undefined
      }
      log_security_event_safe: {
        Args: {
          event_details?: Json
          event_message: string
          event_type: string
          severity?: string
        }
        Returns: undefined
      }
      log_vacation_security_event: {
        Args: { details?: Json; event_type: string; vacation_id: string }
        Returns: undefined
      }
      perform_database_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      refresh_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_automated_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      run_logs_rls_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      sanitize_text_input: {
        Args: { input_text: string; max_length?: number }
        Returns: string
      }
      schedule_maintenance_tasks: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_user_roles_to_jwt: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_query_performance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      user_has_role: {
        Args: { check_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      validate_data_integrity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_database_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_email_format_enhanced: {
        Args: { email: string }
        Returns: boolean
      }
      verify_complete_fix: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_data_access_fix: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_policy_fix: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_role_assignments: {
        Args: Record<PropertyKey, never>
        Returns: {
          assigned_role: Database["public"]["Enums"]["user_role"]
          is_current_user: boolean
          user_email: string
          user_name: string
        }[]
      }
    }
    Enums: {
      assignment_type: "waterDamage" | "fireDamage" | "mold" | "other"
      employee_status: "active" | "inactive" | "on_leave" | "terminated"
      user_role: "administrator" | "skadeleder" | "servicemedarbejder"
      vacation_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      assignment_type: ["waterDamage", "fireDamage", "mold", "other"],
      employee_status: ["active", "inactive", "on_leave", "terminated"],
      user_role: ["administrator", "skadeleder", "servicemedarbejder"],
      vacation_status: ["pending", "approved", "rejected"],
    },
  },
} as const
