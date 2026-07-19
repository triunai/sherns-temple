export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string
          email: string
          is_approved: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          is_approved?: boolean
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          is_approved?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      devotee_submissions: {
        Row: {
          admin_approval: string
          approved_at: string | null
          approved_by: string | null
          approved_by_email: string | null
          created_at: string
          devotee_email: string
          devotee_name: string
          devotee_whatsapp: string
          event_id: string
          family_json: Json | null
          payment_proof: string
          primary_natchatram: string | null
          primary_rasi: string | null
          receipt_id: string
          sponsored_items: Json | null
          total_amount_paid: number
        }
        Insert: {
          admin_approval?: string
          approved_at?: string | null
          approved_by?: string | null
          approved_by_email?: string | null
          created_at?: string
          devotee_email: string
          devotee_name: string
          devotee_whatsapp: string
          event_id: string
          family_json?: Json | null
          payment_proof: string
          primary_natchatram?: string | null
          primary_rasi?: string | null
          receipt_id?: string
          sponsored_items?: Json | null
          total_amount_paid: number
        }
        Update: {
          admin_approval?: string
          approved_at?: string | null
          approved_by?: string | null
          approved_by_email?: string | null
          created_at?: string
          devotee_email?: string
          devotee_name?: string
          devotee_whatsapp?: string
          event_id?: string
          family_json?: Json | null
          payment_proof?: string
          primary_natchatram?: string | null
          primary_rasi?: string | null
          receipt_id?: string
          sponsored_items?: Json | null
          total_amount_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "devotee_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      event_materials: {
        Row: {
          created_at: string
          event_id: string
          funding_status: string | null
          item_id: string
          material_name: string
          qty_received: number
          target_quantity: number
          unit_type: string
        }
        Insert: {
          created_at?: string
          event_id: string
          funding_status?: string | null
          item_id?: string
          material_name: string
          qty_received?: number
          target_quantity: number
          unit_type: string
        }
        Update: {
          created_at?: string
          event_id?: string
          funding_status?: string | null
          item_id?: string
          material_name?: string
          qty_received?: number
          target_quantity?: number
          unit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_materials_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      events: {
        Row: {
          abhishegam_time: string | null
          bank_details_display: string
          cost_per_pax: number
          created_at: string
          display_qr_asset: string | null
          event_id: string
          event_name: string
          featured_poster: string | null
          is_favorited: boolean | null
          pooja_start_time: string | null
          show_in_carousel: boolean | null
          special_notes: string | null
          status: string
        }
        Insert: {
          abhishegam_time?: string | null
          bank_details_display?: string
          cost_per_pax?: number
          created_at?: string
          display_qr_asset?: string | null
          event_id?: string
          event_name: string
          featured_poster?: string | null
          is_favorited?: boolean | null
          pooja_start_time?: string | null
          show_in_carousel?: boolean | null
          special_notes?: string | null
          status?: string
        }
        Update: {
          abhishegam_time?: string | null
          bank_details_display?: string
          cost_per_pax?: number
          created_at?: string
          display_qr_asset?: string | null
          event_id?: string
          event_name?: string
          featured_poster?: string | null
          is_favorited?: boolean | null
          pooja_start_time?: string | null
          show_in_carousel?: boolean | null
          special_notes?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_submission_status: {
        Args: { p_receipt_id?: string; p_whatsapp?: string }
        Returns: {
          event_name: string
          receipt_id: string
          status: string
          submitted_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]