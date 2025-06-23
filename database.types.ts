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
      bets: {
        Row: {
          calculated_price: number
          created_at: string | null
          guessed_birth_date: string
          guessed_weight: number
          id: string
          nickname: string | null
          payment_id: string | null
          payment_status: string | null
          pool_id: string
          user_id: string
        }
        Insert: {
          calculated_price: number
          created_at?: string | null
          guessed_birth_date: string
          guessed_weight: number
          id?: string
          nickname?: string | null
          payment_id?: string | null
          payment_status?: string | null
          pool_id: string
          user_id: string
        }
        Update: {
          calculated_price?: number
          created_at?: string | null
          guessed_birth_date?: string
          guessed_weight?: number
          id?: string
          nickname?: string | null
          payment_id?: string | null
          payment_status?: string | null
          pool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          id: number
          title: string | null
        }
        Insert: {
          id?: number
          title?: string | null
        }
        Update: {
          id?: number
          title?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          pool_id: string
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_receipt_url: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          pool_id: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_receipt_url?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          pool_id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_receipt_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
        ]
      }
      pools: {
        Row: {
          actual_birth_date: string | null
          actual_birth_weight: number | null
          baby_name: string | null
          created_at: string | null
          due_date: string | null
          id: string
          is_locked: boolean | null
          mu_weight: number | null
          price_ceiling: number | null
          price_floor: number | null
          sigma_days: number | null
          sigma_weight: number | null
          slug: string
          user_id: string
        }
        Insert: {
          actual_birth_date?: string | null
          actual_birth_weight?: number | null
          baby_name?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_locked?: boolean | null
          mu_weight?: number | null
          price_ceiling?: number | null
          price_floor?: number | null
          sigma_days?: number | null
          sigma_weight?: number | null
          slug: string
          user_id: string
        }
        Update: {
          actual_birth_date?: string | null
          actual_birth_weight?: number | null
          baby_name?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_locked?: boolean | null
          mu_weight?: number | null
          price_ceiling?: number | null
          price_floor?: number | null
          sigma_days?: number | null
          sigma_weight?: number | null
          slug?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
