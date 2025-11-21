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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          assignment_date: string
          attachment_files: Json | null
          car_id: string | null
          car_ids: string[] | null
          case_number: string | null
          created_at: string
          description: string | null
          from_time: string
          id: string
          location: string
          onedrive_folder_id: string | null
          published: boolean | null
          responsible_user_id: string | null
          title: string
          to_time: string
          type: Database["public"]["Enums"]["assignment_type"] | null
          updated_at: string
        }
        Insert: {
          assignment_date: string
          attachment_files?: Json | null
          car_id?: string | null
          car_ids?: string[] | null
          case_number?: string | null
          created_at?: string
          description?: string | null
          from_time: string
          id?: string
          location: string
          onedrive_folder_id?: string | null
          published?: boolean | null
          responsible_user_id?: string | null
          title: string
          to_time: string
          type?: Database["public"]["Enums"]["assignment_type"] | null
          updated_at?: string
        }
        Update: {
          assignment_date?: string
          attachment_files?: Json | null
          car_id?: string | null
          car_ids?: string[] | null
          case_number?: string | null
          created_at?: string
          description?: string | null
          from_time?: string
          id?: string
          location?: string
          onedrive_folder_id?: string | null
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
            foreignKeyName: "fk_assignments_responsible_user_id"
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
          show_in_planner: boolean
          total_weight: number | null
          towing_capacity_with_brakes: number | null
          towing_capacity_without_brakes: number | null
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
          show_in_planner?: boolean
          total_weight?: number | null
          towing_capacity_with_brakes?: number | null
          towing_capacity_without_brakes?: number | null
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
          show_in_planner?: boolean
          total_weight?: number | null
          towing_capacity_with_brakes?: number | null
          towing_capacity_without_brakes?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      case_folder_mappings: {
        Row: {
          case_number: string
          created_at: string
          created_by: string | null
          custom_folder_name: string
          folder_url: string | null
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          case_number: string
          created_at?: string
          created_by?: string | null
          custom_folder_name: string
          folder_url?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          case_number?: string
          created_at?: string
          created_by?: string | null
          custom_folder_name?: string
          folder_url?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      case_onedrive_mappings: {
        Row: {
          case_number: string
          created_at: string | null
          created_by: string | null
          folder_id: string
          folder_url: string
          id: string
          updated_at: string | null
        }
        Insert: {
          case_number: string
          created_at?: string | null
          created_by?: string | null
          folder_id: string
          folder_url: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          case_number?: string
          created_at?: string | null
          created_by?: string | null
          folder_id?: string
          folder_url?: string
          id?: string
          updated_at?: string | null
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
      on_call_duties: {
        Row: {
          created_at: string
          created_by: string
          duty_date: string
          duty_type: Database["public"]["Enums"]["duty_type"]
          employee_id: string | null
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          duty_date: string
          duty_type: Database["public"]["Enums"]["duty_type"]
          employee_id?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          duty_date?: string
          duty_type?: Database["public"]["Enums"]["duty_type"]
          employee_id?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "on_call_duties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_call_duties_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onedrive_settings: {
        Row: {
          base_sharepoint_url: string
          created_at: string
          folder_naming_pattern: string
          id: string
          is_active: boolean
          main_folder_path: string
          updated_at: string
        }
        Insert: {
          base_sharepoint_url: string
          created_at?: string
          folder_naming_pattern?: string
          id?: string
          is_active?: boolean
          main_folder_path?: string
          updated_at?: string
        }
        Update: {
          base_sharepoint_url?: string
          created_at?: string
          folder_naming_pattern?: string
          id?: string
          is_active?: boolean
          main_folder_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      planner_change_log: {
        Row: {
          assignment_id: string | null
          change_details: Json
          changed_by: string
          changed_by_first_name: string | null
          changed_by_name: string
          created_at: string
          id: string
          operation: string
        }
        Insert: {
          assignment_id?: string | null
          change_details: Json
          changed_by: string
          changed_by_first_name?: string | null
          changed_by_name: string
          created_at?: string
          id?: string
          operation: string
        }
        Update: {
          assignment_id?: string | null
          change_details?: Json
          changed_by?: string
          changed_by_first_name?: string | null
          changed_by_name?: string
          created_at?: string
          id?: string
          operation?: string
        }
        Relationships: [
          {
            foreignKeyName: "planner_change_log_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planner_change_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          expires_at: string | null
          has_asbestos_certificate: boolean | null
          has_drivers_license: boolean | null
          has_forklift_license: boolean
          has_trailer_license: boolean | null
          id: string
          is_temporary: boolean | null
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
          expires_at?: string | null
          has_asbestos_certificate?: boolean | null
          has_drivers_license?: boolean | null
          has_forklift_license?: boolean
          has_trailer_license?: boolean | null
          id: string
          is_temporary?: boolean | null
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
          expires_at?: string | null
          has_asbestos_certificate?: boolean | null
          has_drivers_license?: boolean | null
          has_forklift_license?: boolean
          has_trailer_license?: boolean | null
          id?: string
          is_temporary?: boolean | null
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
      sick_leave_notifications_sent: {
        Row: {
          created_at: string
          days_when_sent: number
          id: string
          notification_sent_at: string
          sick_leave_id: string
        }
        Insert: {
          created_at?: string
          days_when_sent: number
          id?: string
          notification_sent_at?: string
          sick_leave_id: string
        }
        Update: {
          created_at?: string
          days_when_sent?: number
          id?: string
          notification_sent_at?: string
          sick_leave_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sick_leave_notifications_sent_sick_leave_id_fkey"
            columns: ["sick_leave_id"]
            isOneToOne: false
            referencedRelation: "sick_leave_records"
            referencedColumns: ["id"]
          },
        ]
      }
      sick_leave_records: {
        Row: {
          created_at: string
          created_by: string
          end_date: string | null
          id: string
          notes: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sick_leave_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sick_leave_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      warehouse_items: {
        Row: {
          address: string
          case_number: string | null
          created_at: string
          created_by: string | null
          hall: string | null
          id: string
          is_cleaned: string
          notes: string | null
          quantity: number
          updated_at: string
        }
        Insert: {
          address: string
          case_number?: string | null
          created_at?: string
          created_by?: string | null
          hall?: string | null
          id?: string
          is_cleaned?: string
          notes?: string | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          address?: string
          case_number?: string | null
          created_at?: string
          created_by?: string | null
          hall?: string | null
          id?: string
          is_cleaned?: string
          notes?: string | null
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
      base64url_decode: { Args: { data: string }; Returns: string }
      base64url_encode: { Args: { data: string }; Returns: string }
      can_access_assignment: {
        Args: { assignment_id: string }
        Returns: boolean
      }
      can_access_case_data: {
        Args: { case_number_param: string }
        Returns: boolean
      }
      can_access_profile_field: {
        Args: { field_name: string; target_user_id: string }
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
      can_view_fuel_codes: { Args: never; Returns: boolean }
      can_view_fuel_codes_audited: { Args: never; Returns: boolean }
      check_data_access_health: { Args: never; Returns: Json }
      check_rate_limit_security: {
        Args: {
          max_attempts?: number
          operation_key: string
          window_minutes?: number
        }
        Returns: boolean
      }
      check_system_health: { Args: never; Returns: Json }
      cleanup_expired_temporary_users: {
        Args: never
        Returns: {
          deleted_count: number
          deleted_user_ids: string[]
          message: string
        }[]
      }
      cleanup_old_change_logs: { Args: never; Returns: Json }
      clear_sick_leave_data: { Args: never; Returns: Json }
      create_logs_partition_for_month: { Args: never; Returns: undefined }
      debug_auth_info: { Args: never; Returns: Json }
      delete_expired_approved_vacations: { Args: never; Returns: undefined }
      delete_old_rejected_vacations: { Args: never; Returns: undefined }
      emergency_log_cleanup: { Args: never; Returns: Json }
      end_sick_leave: {
        Args: { p_end_date: string; p_record_id: string }
        Returns: boolean
      }
      enhanced_security_monitor: { Args: never; Returns: Json }
      ensure_logs_rls_consistency: { Args: never; Returns: string }
      example_function: { Args: never; Returns: Json }
      final_database_optimization: { Args: never; Returns: Json }
      generate_database_summary: { Args: never; Returns: Json }
      get_accessible_profiles: {
        Args: never
        Returns: {
          access_level: string
          avatar_url: string
          created_at: string
          email: string
          id: string
          job_title: string
          name: string
          phone: string
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
        }[]
      }
      get_car_with_conditional_access: {
        Args: { car_row: Database["public"]["Tables"]["cars"]["Row"] }
        Returns: {
          car_number: string
          created_at: string
          fuel_card_code: string
          has_trailer_hitch: boolean
          id: string
          is_available: boolean
          name: string
          notes: string
          number_plate: string
          show_in_planner: boolean
          updated_at: string
        }[]
      }
      get_cars_with_security: {
        Args: never
        Returns: {
          car_number: string
          created_at: string
          fuel_card_code: string
          has_trailer_hitch: boolean
          id: string
          is_available: boolean
          name: string
          notes: string
          number_plate: string
          show_in_planner: boolean
          updated_at: string
        }[]
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_demo_cars_with_security: {
        Args: never
        Returns: {
          car_number: string
          created_at: string
          fuel_card_code: string
          has_trailer_hitch: boolean
          id: string
          is_available: boolean
          name: string
          notes: string
          number_plate: string
          show_in_planner: boolean
          updated_at: string
        }[]
      }
      get_demo_profiles_admin_detailed: {
        Args: { full_access?: boolean }
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          expires_at: string
          id: string
          is_temporary: boolean
          job_title: string
          name: string
          notes: string
          on_leave: boolean
          phone: string
          role: string
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
        }[]
      }
      get_demo_vacations: {
        Args: never
        Returns: {
          created_at: string
          end_date: string
          end_time: string
          id: string
          is_same_day: boolean
          notes: string
          reason: string
          request_type: string
          start_date: string
          start_time: string
          status: Database["public"]["Enums"]["vacation_status"]
          updated_at: string
          user_id: string
        }[]
      }
      get_demo_warehouse_items: {
        Args: never
        Returns: {
          address: string
          case_number: string
          created_at: string
          created_by: string
          hall: string
          id: string
          is_cleaned: string
          notes: string
          quantity: number
          updated_at: string
        }[]
      }
      get_enhanced_system_metrics: { Args: never; Returns: Json }
      get_historical_sick_leave_trends: {
        Args: { months_back?: number }
        Returns: Json
      }
      get_profile_detailed: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          expires_at: string
          id: string
          is_temporary: boolean
          job_title: string
          name: string
          notes: string
          on_leave: boolean
          phone: string
          role: string
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
        }[]
      }
      get_profile_with_role: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          email: string
          id: string
          job_title: string
          name: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["employee_status"]
        }[]
      }
      get_profiles_admin_detailed:
        | {
            Args: never
            Returns: {
              avatar_url: string
              created_at: string
              email: string
              expires_at: string
              id: string
              is_temporary: boolean
              job_title: string
              name: string
              notes: string
              on_leave: boolean
              phone: string
              status: Database["public"]["Enums"]["employee_status"]
              updated_at: string
            }[]
          }
        | {
            Args: { access_reason?: string; full_access?: boolean }
            Returns: {
              avatar_url: string
              created_at: string
              email: string
              expires_at: string
              id: string
              is_temporary: boolean
              job_title: string
              name: string
              notes: string
              on_leave: boolean
              phone: string
              role: Database["public"]["Enums"]["user_role"]
              status: Database["public"]["Enums"]["employee_status"]
              updated_at: string
            }[]
          }
      get_profiles_basic: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          id: string
          job_title: string
          name: string
          on_leave: boolean
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
        }[]
      }
      get_security_events_summary: {
        Args: never
        Returns: {
          affected_users: number
          event_count: number
          event_type: string
          last_occurrence: string
        }[]
      }
      get_sick_leave_statistics: {
        Args: { period_type?: string; target_date?: string }
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
      hmac_sha256: { Args: { data: string; key: string }; Returns: string }
      is_admin_or_skadeleder: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_strong_password: { Args: { password: string }; Returns: boolean }
      is_user_assigned_to_assignment: {
        Args: { assignment_id: string; user_id: string }
        Returns: boolean
      }
      is_valid_email: { Args: { email: string }; Returns: boolean }
      jwt_verify_hs256: {
        Args: { secret: string; token: string }
        Returns: Json
      }
      list_accessible_assignments_with_team: {
        Args: never
        Returns: {
          assignment_date: string
          car_id: string
          car_ids: string[]
          case_number: string
          created_at: string
          description: string
          from_time: string
          id: string
          location: string
          published: boolean
          responsible_user: Json
          responsible_user_id: string
          team: Json
          title: string
          to_time: string
          type: Database["public"]["Enums"]["assignment_type"]
          updated_at: string
        }[]
      }
      list_demo_assignments_with_team: {
        Args: never
        Returns: {
          assignment_cars: Json
          case_number: string
          client_name: string
          contact_person: string
          created_at: string
          date: string
          description: string
          id: string
          location: string
          published: boolean
          responsible_user_id: string
          special_instructions: string
          status: string
          team: Json
          title: string
          updated_at: string
        }[]
      }
      log_data_access_attempt: {
        Args: {
          access_type: string
          record_id?: string
          success?: boolean
          table_name: string
        }
        Returns: undefined
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
      log_profile_access_attempt: {
        Args: { access_type: string; profile_id: string }
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
      mask_email: { Args: { p_email: string }; Returns: string }
      mask_phone: { Args: { p_phone: string }; Returns: string }
      perform_database_maintenance: { Args: never; Returns: Json }
      record_sick_leave: {
        Args: { p_notes?: string; p_start_date: string; p_user_id: string }
        Returns: string
      }
      refresh_materialized_views: { Args: never; Returns: undefined }
      run_automated_maintenance: { Args: never; Returns: Json }
      run_logs_rls_maintenance: { Args: never; Returns: string }
      sanitize_text_input: {
        Args: { input_text: string; max_length?: number }
        Returns: string
      }
      schedule_maintenance_tasks: { Args: never; Returns: Json }
      security_health_check: { Args: never; Returns: Json }
      sync_user_roles_to_jwt: { Args: never; Returns: undefined }
      test_query_performance: { Args: never; Returns: Json }
      user_has_role: {
        Args: { check_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      validate_data_integrity: { Args: never; Returns: Json }
      validate_database_health: { Args: never; Returns: Json }
      validate_email_format_enhanced: {
        Args: { email: string }
        Returns: boolean
      }
      validate_input_security: {
        Args: { input_text: string; input_type: string; max_length?: number }
        Returns: boolean
      }
      verify_complete_fix: { Args: never; Returns: Json }
      verify_data_access_fix: { Args: never; Returns: Json }
      verify_policy_fix: { Args: never; Returns: Json }
      verify_role_assignments: {
        Args: never
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
      duty_type: "skadeleder_vagt" | "kørevagt"
      employee_status: "active" | "inactive" | "on_leave" | "terminated"
      user_role: "administrator" | "skadeleder" | "servicemedarbejder" | "vikar"
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
      duty_type: ["skadeleder_vagt", "kørevagt"],
      employee_status: ["active", "inactive", "on_leave", "terminated"],
      user_role: ["administrator", "skadeleder", "servicemedarbejder", "vikar"],
      vacation_status: ["pending", "approved", "rejected"],
    },
  },
} as const
