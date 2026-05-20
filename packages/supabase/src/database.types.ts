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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          body: string
          community_id: string
          created_at: string
          id: string
          severity: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          community_id: string
          created_at?: string
          id?: string
          severity?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          community_id?: string
          created_at?: string
          id?: string
          severity?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          address: string
          city: string
          created_at: string | null
          firm_id: string
          id: string
          name: string
          postal_code: string
          president_id: string | null
          units_count: number
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          firm_id: string
          id?: string
          name: string
          postal_code: string
          president_id?: string | null
          units_count?: number
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          firm_id?: string
          id?: string
          name?: string
          postal_code?: string
          president_id?: string | null
          units_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "communities_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_president_id_fkey"
            columns: ["president_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          community_id: string
          created_at: string | null
          description: string | null
          file_size: number
          file_url: string
          id: string
          is_public: boolean
          mime_type: string
          name: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          community_id: string
          created_at?: string | null
          description?: string | null
          file_size: number
          file_url: string
          id?: string
          is_public?: boolean
          mime_type: string
          name: string
          uploaded_by: string
        }
        Update: {
          category?: string
          community_id?: string
          created_at?: string | null
          description?: string | null
          file_size?: number
          file_url?: string
          id?: string
          is_public?: boolean
          mime_type?: string
          name?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      firms: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          plan: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          plan?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          plan?: string
        }
        Relationships: []
      }
      incidence_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          incidence_id: string
          is_internal: boolean
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          incidence_id: string
          is_internal?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          incidence_id?: string
          is_internal?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidence_messages_incidence_id_fkey"
            columns: ["incidence_id"]
            isOneToOne: false
            referencedRelation: "incidences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidence_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incidences: {
        Row: {
          admin_notes: string | null
          ai_response: string | null
          ai_summary: string | null
          category: string
          community_id: string
          created_at: string | null
          description: string
          id: string
          photo_url: string | null
          reported_by: string
          resolved_at: string | null
          status: string
          title: string
          updated_at: string | null
          urgency: string
        }
        Insert: {
          admin_notes?: string | null
          ai_response?: string | null
          ai_summary?: string | null
          category: string
          community_id: string
          created_at?: string | null
          description: string
          id?: string
          photo_url?: string | null
          reported_by: string
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
          urgency?: string
        }
        Update: {
          admin_notes?: string | null
          ai_response?: string | null
          ai_summary?: string | null
          category?: string
          community_id?: string
          created_at?: string | null
          description?: string
          id?: string
          photo_url?: string | null
          reported_by?: string
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidences_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidences_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          code: string
          community_id: string
          created_at: string | null
          email: string | null
          expires_at: string | null
          id: string
          role: string
          unit_number: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code?: string
          community_id: string
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          role?: string
          unit_number: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          community_id?: string
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          role?: string
          unit_number?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          email_invite_code: boolean
          email_new_announcement: boolean
          email_new_incidence: boolean
          email_new_message: boolean
          email_status_change: boolean
          push_new_announcement: boolean
          push_new_incidence: boolean
          push_new_message: boolean
          push_status_change: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          email_invite_code?: boolean
          email_new_announcement?: boolean
          email_new_incidence?: boolean
          email_new_message?: boolean
          email_status_change?: boolean
          push_new_announcement?: boolean
          push_new_incidence?: boolean
          push_new_message?: boolean
          push_status_change?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          email_invite_code?: boolean
          email_new_announcement?: boolean
          email_new_incidence?: boolean
          email_new_message?: boolean
          email_status_change?: boolean
          push_new_announcement?: boolean
          push_new_incidence?: boolean
          push_new_message?: boolean
          push_status_change?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          community_id: string | null
          created_at: string | null
          firm_id: string | null
          full_name: string
          id: string
          phone: string | null
          role: string
          unit_number: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          firm_id?: string | null
          full_name: string
          id: string
          phone?: string | null
          role: string
          unit_number?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          firm_id?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          unit_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
