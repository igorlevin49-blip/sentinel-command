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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          meta: Json | null
          org_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          meta?: Json | null
          org_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          meta?: Json | null
          org_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          customer_org_id: string | null
          end_date: string | null
          id: string
          number: string | null
          org_id: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_org_id?: string | null
          end_date?: string | null
          id?: string
          number?: string | null
          org_id: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_org_id?: string | null
          end_date?: string | null
          id?: string
          number?: string | null
          org_id?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_customer_org_id_fkey"
            columns: ["customer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      counterparties: {
        Row: {
          contract_no: string | null
          created_at: string
          id: string
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          contract_no?: string | null
          created_at?: string
          id?: string
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          contract_no?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counterparties_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_rules: {
        Row: {
          action_json: Json | null
          condition_json: Json | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          priority: number
        }
        Insert: {
          action_json?: Json | null
          condition_json?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          priority?: number
        }
        Update: {
          action_json?: Json | null
          condition_json?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_rules: {
        Row: {
          action: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          sla_rule_id: string | null
          target_role: string | null
          trigger_after_s: number
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          sla_rule_id?: string | null
          target_role?: string | null
          trigger_after_s?: number
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          sla_rule_id?: string | null
          target_role?: string | null
          trigger_after_s?: number
        }
        Relationships: [
          {
            foreignKeyName: "escalation_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_rules_sla_rule_id_fkey"
            columns: ["sla_rule_id"]
            isOneToOne: false
            referencedRelation: "sla_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          accepted_at: string | null
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          created_by_user: string | null
          description: string | null
          id: string
          object_id: string | null
          org_id: string
          resolved_at: string | null
          severity: Database["public"]["Enums"]["risk_level"]
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          type: Database["public"]["Enums"]["incident_type"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          created_by_user?: string | null
          description?: string | null
          id?: string
          object_id?: string | null
          org_id: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          type?: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          created_by_user?: string | null
          description?: string | null
          id?: string
          object_id?: string | null
          org_id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          type?: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      object_acceptance: {
        Row: {
          action: Database["public"]["Enums"]["acceptance_action"]
          comment: string | null
          created_at: string
          id: string
          object_id: string
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["acceptance_action"]
          comment?: string | null
          created_at?: string
          id?: string
          object_id: string
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["acceptance_action"]
          comment?: string | null
          created_at?: string
          id?: string
          object_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "object_acceptance_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      object_clients: {
        Row: {
          created_at: string
          id: string
          object_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          object_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          object_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_clients_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
        ]
      }
      objects: {
        Row: {
          address: string | null
          counterparty_id: string | null
          created_at: string
          id: string
          is_active: boolean
          lat: number | null
          lon: number | null
          name: string
          org_id: string
          risk_level: Database["public"]["Enums"]["risk_level"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          counterparty_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lon?: number | null
          name: string
          org_id: string
          risk_level?: Database["public"]["Enums"]["risk_level"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          counterparty_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lon?: number | null
          name?: string
          org_id?: string
          risk_level?: Database["public"]["Enums"]["risk_level"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objects_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          org_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          org_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          org_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          org_type: string
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_type?: string
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_type?: string
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Relationships: []
      }
      patrol_checkpoints: {
        Row: {
          code: string | null
          created_at: string
          expected_order: number
          id: string
          lat: number | null
          lon: number | null
          name: string
          route_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          expected_order?: number
          id?: string
          lat?: number | null
          lon?: number | null
          name: string
          route_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          expected_order?: number
          id?: string
          lat?: number | null
          lon?: number | null
          name?: string
          route_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patrol_checkpoints_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "patrol_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      patrol_events: {
        Row: {
          checkpoint_id: string
          created_at: string
          id: string
          lat: number | null
          lon: number | null
          method: Database["public"]["Enums"]["patrol_method"]
          note: string | null
          occurred_at: string
          run_id: string
        }
        Insert: {
          checkpoint_id: string
          created_at?: string
          id?: string
          lat?: number | null
          lon?: number | null
          method?: Database["public"]["Enums"]["patrol_method"]
          note?: string | null
          occurred_at?: string
          run_id: string
        }
        Update: {
          checkpoint_id?: string
          created_at?: string
          id?: string
          lat?: number | null
          lon?: number | null
          method?: Database["public"]["Enums"]["patrol_method"]
          note?: string | null
          occurred_at?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patrol_events_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "patrol_checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrol_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "patrol_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      patrol_routes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          object_id: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          object_id: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          object_id?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patrol_routes_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrol_routes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      patrol_runs: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          org_id: string
          route_id: string
          shift_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["patrol_run_status"]
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          org_id: string
          route_id: string
          shift_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["patrol_run_status"]
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          org_id?: string
          route_id?: string
          shift_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["patrol_run_status"]
        }
        Relationships: [
          {
            foreignKeyName: "patrol_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrol_runs_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "patrol_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrol_runs_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      personnel: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          org_id: string
          phone: string | null
          position: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          org_id: string
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          org_id?: string
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personnel_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          object_id: string
          org_id: string
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          object_id: string
          org_id: string
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          object_id?: string
          org_id?: string
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          accepted_at: string | null
          arrived_at: string | null
          assigned_by_user: string | null
          created_at: string
          departed_at: string | null
          id: string
          incident_id: string
          result: string | null
        }
        Insert: {
          accepted_at?: string | null
          arrived_at?: string | null
          assigned_by_user?: string | null
          created_at?: string
          departed_at?: string | null
          id?: string
          incident_id: string
          result?: string | null
        }
        Update: {
          accepted_at?: string | null
          arrived_at?: string | null
          assigned_by_user?: string | null
          created_at?: string
          departed_at?: string | null
          id?: string
          incident_id?: string
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          created_at: string
          end_lat: number | null
          end_lon: number | null
          id: string
          org_id: string
          personnel_id: string
          planned_end: string
          planned_start: string
          post_id: string
          start_lat: number | null
          start_lon: number | null
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
          violations: number
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          end_lat?: number | null
          end_lon?: number | null
          id?: string
          org_id: string
          personnel_id: string
          planned_end: string
          planned_start: string
          post_id: string
          start_lat?: number | null
          start_lon?: number | null
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          violations?: number
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          end_lat?: number | null
          end_lon?: number | null
          id?: string
          org_id?: string
          personnel_id?: string
          planned_end?: string
          planned_start?: string
          post_id?: string
          start_lat?: number | null
          start_lon?: number | null
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          violations?: number
        }
        Relationships: [
          {
            foreignKeyName: "shifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_rules: {
        Row: {
          contract_id: string | null
          created_at: string
          id: string
          incident_type: string | null
          is_active: boolean
          name: string
          org_id: string
          resolve_time_s: number
          response_time_s: number
          severity: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          id?: string
          incident_type?: string | null
          is_active?: boolean
          name: string
          org_id: string
          resolve_time_s?: number
          response_time_s?: number
          severity?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          id?: string
          incident_type?: string | null
          is_active?: boolean
          name?: string
          org_id?: string
          resolve_time_s?: number
          response_time_s?: number
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_rules_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_object: { Args: { _object_id: string }; Returns: boolean }
      client_object_ids: { Args: never; Returns: string[] }
      current_user_id: { Args: never; Returns: string }
      guard_object_ids: { Args: never; Returns: string[] }
      guard_personnel_id: { Args: never; Returns: string }
      has_platform_role: {
        Args: { _role: Database["public"]["Enums"]["platform_role"] }
        Returns: boolean
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["member_role"] }
        Returns: boolean
      }
      is_platform_staff: { Args: never; Returns: boolean }
      is_platform_super_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      user_org_id: { Args: never; Returns: string }
      user_org_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      acceptance_action: "accept" | "handover"
      incident_status:
        | "created"
        | "accepted"
        | "in_progress"
        | "resolved"
        | "closed"
      incident_type: "alarm" | "violation" | "event" | "fraud"
      member_role:
        | "super_admin"
        | "org_admin"
        | "dispatcher"
        | "chief"
        | "director"
        | "guard"
        | "client"
      org_type: "security_agency" | "internal_security"
      patrol_method: "gps" | "qr" | "nfc" | "manual"
      patrol_run_status: "pending" | "in_progress" | "completed" | "overdue"
      platform_role:
        | "platform_super_admin"
        | "platform_admin"
        | "platform_dispatcher"
        | "platform_director"
      post_type: "static" | "checkpoint" | "mobile" | "kpp"
      risk_level: "low" | "medium" | "high" | "critical"
      shift_status: "scheduled" | "active" | "completed" | "missed"
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
      acceptance_action: ["accept", "handover"],
      incident_status: [
        "created",
        "accepted",
        "in_progress",
        "resolved",
        "closed",
      ],
      incident_type: ["alarm", "violation", "event", "fraud"],
      member_role: [
        "super_admin",
        "org_admin",
        "dispatcher",
        "chief",
        "director",
        "guard",
        "client",
      ],
      org_type: ["security_agency", "internal_security"],
      patrol_method: ["gps", "qr", "nfc", "manual"],
      patrol_run_status: ["pending", "in_progress", "completed", "overdue"],
      platform_role: [
        "platform_super_admin",
        "platform_admin",
        "platform_dispatcher",
        "platform_director",
      ],
      post_type: ["static", "checkpoint", "mobile", "kpp"],
      risk_level: ["low", "medium", "high", "critical"],
      shift_status: ["scheduled", "active", "completed", "missed"],
    },
  },
} as const
