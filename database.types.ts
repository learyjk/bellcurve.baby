export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      guesses: {
        Row: {
          calculated_price: number;
          created_at: string | null;
          guessed_birth_date: string;
          guessed_weight: number;
          id: string;
          is_anonymous: boolean;
          name: string | null;
          payment_id: string | null;
          payment_status: string | null;
          pool_id: string;
          user_id: string;
        };
        Insert: {
          calculated_price: number;
          created_at?: string | null;
          guessed_birth_date: string;
          guessed_weight: number;
          id?: string;
          is_anonymous?: boolean;
          name?: string | null;
          payment_id?: string | null;
          payment_status?: string | null;
          pool_id: string;
          user_id: string;
        };
        Update: {
          calculated_price?: number;
          created_at?: string | null;
          guessed_birth_date?: string;
          guessed_weight?: number;
          id?: string;
          is_anonymous?: boolean;
          name?: string | null;
          payment_id?: string | null;
          payment_status?: string | null;
          pool_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bets_pool_id_fkey";
            columns: ["pool_id"];
            isOneToOne: false;
            referencedRelation: "pools";
            referencedColumns: ["id"];
          }
        ];
      };
      pools: {
        Row: {
          actual_birth_date: string | null;
          actual_birth_weight: number | null;
          baby_name: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_locked: boolean | null;
          mu_due_date: string | null;
          mu_weight: number;
          organized_by: string | null;
          organizer_image_url: string | null;
          price_ceiling: number | null;
          price_floor: number | null;
          sigma_days: number | null;
          sigma_weight: number | null;
          slug: string;
          user_id: string;
        };
        Insert: {
          actual_birth_date?: string | null;
          actual_birth_weight?: number | null;
          baby_name?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_locked?: boolean | null;
          mu_due_date?: string | null;
          mu_weight?: number;
          organized_by?: string | null;
          organizer_image_url?: string | null;
          price_ceiling?: number | null;
          price_floor?: number | null;
          sigma_days?: number | null;
          sigma_weight?: number | null;
          slug: string;
          user_id: string;
        };
        Update: {
          actual_birth_date?: string | null;
          actual_birth_weight?: number | null;
          baby_name?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_locked?: boolean | null;
          mu_due_date?: string | null;
          mu_weight?: number;
          organized_by?: string | null;
          organizer_image_url?: string | null;
          price_ceiling?: number | null;
          price_floor?: number | null;
          sigma_days?: number | null;
          sigma_weight?: number | null;
          slug?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      rankings: {
        Row: {
          created_at: string | null;
          distance: number;
          guess_id: string;
          id: string;
          pool_id: string;
          rank: number;
        };
        Insert: {
          created_at?: string | null;
          distance: number;
          guess_id: string;
          id?: string;
          pool_id: string;
          rank: number;
        };
        Update: {
          created_at?: string | null;
          distance?: number;
          guess_id?: string;
          id?: string;
          pool_id?: string;
          rank?: number;
        };
        Relationships: [
          {
            foreignKeyName: "rankings_bet_id_fkey";
            columns: ["guess_id"];
            isOneToOne: false;
            referencedRelation: "guesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rankings_pool_id_fkey";
            columns: ["pool_id"];
            isOneToOne: false;
            referencedRelation: "pools";
            referencedColumns: ["id"];
          }
        ];
      };
      user_features: {
        Row: {
          feature: string;
          granted_at: string | null;
          granted_by: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          feature: string;
          granted_at?: string | null;
          granted_by?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          feature?: string;
          granted_at?: string | null;
          granted_by?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
