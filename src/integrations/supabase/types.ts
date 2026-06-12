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
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          match_id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          match_id: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          match_id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          from_user: string
          kind: Database["public"]["Enums"]["like_kind"]
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          kind: Database["public"]["Enums"]["like_kind"]
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          kind?: Database["public"]["Enums"]["like_kind"]
          to_user?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["message_kind"]
          metadata: Json | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      place_saves: {
        Row: {
          created_at: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_saves_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          available_from: string | null
          bills_included: boolean
          city: string
          created_at: string
          currency: string
          description: string
          furnished: boolean
          host_id: string
          id: string
          min_stay_months: number | null
          neighborhood: string | null
          photos: string[]
          rent_monthly: number
          room_type: Database["public"]["Enums"]["room_type"]
          status: Database["public"]["Enums"]["place_status"]
          title: string
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          bills_included?: boolean
          city: string
          created_at?: string
          currency?: string
          description?: string
          furnished?: boolean
          host_id: string
          id?: string
          min_stay_months?: number | null
          neighborhood?: string | null
          photos?: string[]
          rent_monthly: number
          room_type?: Database["public"]["Enums"]["room_type"]
          status?: Database["public"]["Enums"]["place_status"]
          title: string
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          bills_included?: boolean
          city?: string
          created_at?: string
          currency?: string
          description?: string
          furnished?: boolean
          host_id?: string
          id?: string
          min_stay_months?: number | null
          neighborhood?: string | null
          photos?: string[]
          rent_monthly?: number
          room_type?: Database["public"]["Enums"]["room_type"]
          status?: Database["public"]["Enums"]["place_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_contacts: {
        Row: {
          contact_handle: string | null
          contact_visible_to_matches: boolean
          created_at: string
          email_contact: string | null
          phone: string | null
          phone_verified: boolean
          phone_visible_to_matches: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_handle?: string | null
          contact_visible_to_matches?: boolean
          created_at?: string
          email_contact?: string | null
          phone?: string | null
          phone_verified?: boolean
          phone_visible_to_matches?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_handle?: string | null
          contact_visible_to_matches?: boolean
          created_at?: string
          email_contact?: string | null
          phone?: string | null
          phone_verified?: boolean
          phone_visible_to_matches?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          user_id: string
          tier: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          tier?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          tier?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          alcohol_in_house: string | null
          bio: string
          budget_max: number | null
          budget_min: number | null
          city: string | null
          cleanliness: number | null
          cndp_consent_accepted: boolean
          created_at: string
          display_name: string
          drinking: Database["public"]["Enums"]["drinking_t"] | null
          email_match_notif: boolean | null
          email_message_notif: boolean | null
          food_sharing: string | null
          gender: Database["public"]["Enums"]["gender_t"] | null
          guests_frequency: string | null
          id: string
          languages: string[]
          latitude: number | null
          longitude: number | null
          move_in_date: string | null
          neighborhood: string | null
          occupation: string | null
          onboarded: boolean
          pets: Database["public"]["Enums"]["pets_t"] | null
          photo_url: string | null
          prayer_at_home: string | null
          review_status: string
          sleep_schedule: Database["public"]["Enums"]["sleep_t"] | null
          smoking: Database["public"]["Enums"]["smoking_t"] | null
          social_level: Database["public"]["Enums"]["social_t"] | null
          updated_at: string
          user_intent: Database["public"]["Enums"]["user_intent"]
        }
        Insert: {
          age?: number | null
          alcohol_in_house?: string | null
          bio?: string
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          cleanliness?: number | null
          cndp_consent_accepted?: boolean
          created_at?: string
          display_name?: string
          drinking?: Database["public"]["Enums"]["drinking_t"] | null
          email_match_notif?: boolean | null
          email_message_notif?: boolean | null
          food_sharing?: string | null
          gender?: Database["public"]["Enums"]["gender_t"] | null
          guests_frequency?: string | null
          id: string
          languages?: string[]
          latitude?: number | null
          longitude?: number | null
          move_in_date?: string | null
          neighborhood?: string | null
          occupation?: string | null
          onboarded?: boolean
          pets?: Database["public"]["Enums"]["pets_t"] | null
          photo_url?: string | null
          prayer_at_home?: string | null
          review_status?: string
          sleep_schedule?: Database["public"]["Enums"]["sleep_t"] | null
          smoking?: Database["public"]["Enums"]["smoking_t"] | null
          social_level?: Database["public"]["Enums"]["social_t"] | null
          updated_at?: string
          user_intent?: Database["public"]["Enums"]["user_intent"]
        }
        Update: {
          age?: number | null
          alcohol_in_house?: string | null
          bio?: string
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          cleanliness?: number | null
          cndp_consent_accepted?: boolean
          created_at?: string
          display_name?: string
          drinking?: Database["public"]["Enums"]["drinking_t"] | null
          email_match_notif?: boolean | null
          email_message_notif?: boolean | null
          food_sharing?: string | null
          gender?: Database["public"]["Enums"]["gender_t"] | null
          guests_frequency?: string | null
          id?: string
          languages?: string[]
          latitude?: number | null
          longitude?: number | null
          move_in_date?: string | null
          neighborhood?: string | null
          occupation?: string | null
          onboarded?: boolean
          pets?: Database["public"]["Enums"]["pets_t"] | null
          photo_url?: string | null
          prayer_at_home?: string | null
          review_status?: string
          sleep_schedule?: Database["public"]["Enums"]["sleep_t"] | null
          smoking?: Database["public"]["Enums"]["smoking_t"] | null
          social_level?: Database["public"]["Enums"]["social_t"] | null
          updated_at?: string
          user_intent?: Database["public"]["Enums"]["user_intent"]
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      viewings: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          place_id: string | null
          proposed_by: string
          proposed_for: string
          status: Database["public"]["Enums"]["viewing_status"]
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          place_id?: string | null
          proposed_by: string
          proposed_for: string
          status?: Database["public"]["Enums"]["viewing_status"]
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          place_id?: string | null
          proposed_by?: string
          proposed_for?: string
          status?: Database["public"]["Enums"]["viewing_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewings_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profile_contacts_view: {
        Row: {
          contact_handle: string | null
          contact_visible_to_matches: boolean | null
          created_at: string | null
          email_contact: string | null
          phone: string | null
          phone_verified: boolean | null
          phone_visible_to_matches: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          contact_handle?: string | null
          contact_visible_to_matches?: boolean | null
          created_at?: string | null
          email_contact?: string | null
          phone?: never
          phone_verified?: boolean | null
          phone_visible_to_matches?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          contact_handle?: string | null
          contact_visible_to_matches?: boolean | null
          created_at?: string | null
          email_contact?: string | null
          phone?: never
          phone_verified?: boolean | null
          phone_visible_to_matches?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_visible_contact: {
        Args: { _target: string }
        Returns: {
          contact_handle: string
          email_contact: string
          phone: string
          phone_verified: boolean
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      users_matched: { Args: { _a: string; _b: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      drinking_t: "no" | "socially" | "often"
      gender_t: "female" | "male" | "nonbinary" | "other"
      like_kind: "like" | "pass"
      message_kind: "text" | "place_ref" | "viewing"
      pets_t: "none" | "have" | "ok_with"
      place_status: "draft" | "published" | "paused"
      room_type: "private" | "shared"
      sleep_t: "early" | "late" | "flexible"
      smoking_t: "no" | "occasionally" | "yes"
      social_t: "homebody" | "balanced" | "social"
      user_intent: "has_place" | "searching" | "both"
      viewing_status: "proposed" | "accepted" | "declined" | "cancelled"
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
      app_role: ["admin", "moderator", "user"],
      drinking_t: ["no", "socially", "often"],
      gender_t: ["female", "male", "nonbinary", "other"],
      like_kind: ["like", "pass"],
      message_kind: ["text", "place_ref", "viewing"],
      pets_t: ["none", "have", "ok_with"],
      place_status: ["draft", "published", "paused"],
      room_type: ["private", "shared"],
      sleep_t: ["early", "late", "flexible"],
      smoking_t: ["no", "occasionally", "yes"],
      social_t: ["homebody", "balanced", "social"],
      user_intent: ["has_place", "searching", "both"],
      viewing_status: ["proposed", "accepted", "declined", "cancelled"],
    },
  },
} as const
