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
      attendance: {
        Row: {
          "Auto ID": number
          "Created At": string | null
          Date: string | null
          Multi: boolean | null
          "Person Id": number | null
          "Person Name": string | null
          ServiceName: string | null
          TotalAttendees: number | null
          "Updated At": string | null
        }
        Insert: {
          "Auto ID"?: number
          "Created At"?: string | null
          Date?: string | null
          Multi?: boolean | null
          "Person Id"?: number | null
          "Person Name"?: string | null
          ServiceName?: string | null
          TotalAttendees?: number | null
          "Updated At"?: string | null
        }
        Update: {
          "Auto ID"?: number
          "Created At"?: string | null
          Date?: string | null
          Multi?: boolean | null
          "Person Id"?: number | null
          "Person Name"?: string | null
          ServiceName?: string | null
          TotalAttendees?: number | null
          "Updated At"?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_Person Id_fkey"
            columns: ["Person Id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["Auto ID"]
          },
        ]
      }
      people: {
        Row: {
          "Acupuncture Data": boolean | null
          "Auto ID": number
          Carer: boolean | null
          ClientAgreementSigned: boolean | null
          "Created At": string | null
          DateOfBirth: string | null
          Disability: boolean | null
          Email: string | null
          Epilepsy: boolean | null
          "Equality Opt Out": Json | null
          "Ethnic Origin": string | null
          FirstName: string | null
          "Full Name": string | null
          Gender: string | null
          "Give Blood": boolean | null
          Haemophilia: boolean | null
          Id: number | null
          "Joined Date": string | null
          LastName: string | null
          "Marital Status": string | null
          "Marketing Opt Out": boolean | null
          "Other Support": string | null
          OtherInfo: string | null
          Pacemaker: boolean | null
          Phone: string | null
          Postcode: string | null
          Pregnant: boolean | null
          "Referral Source": string | null
          Religion: string | null
          "Sexual Orientation": string | null
          Signed: boolean | null
          Town: string | null
          UniqueId: string | null
          "Updated At": string | null
        }
        Insert: {
          "Acupuncture Data"?: boolean | null
          "Auto ID"?: number
          Carer?: boolean | null
          ClientAgreementSigned?: boolean | null
          "Created At"?: string | null
          DateOfBirth?: string | null
          Disability?: boolean | null
          Email?: string | null
          Epilepsy?: boolean | null
          "Equality Opt Out"?: Json | null
          "Ethnic Origin"?: string | null
          FirstName?: string | null
          "Full Name"?: string | null
          Gender?: string | null
          "Give Blood"?: boolean | null
          Haemophilia?: boolean | null
          Id?: number | null
          "Joined Date"?: string | null
          LastName?: string | null
          "Marital Status"?: string | null
          "Marketing Opt Out"?: boolean | null
          "Other Support"?: string | null
          OtherInfo?: string | null
          Pacemaker?: boolean | null
          Phone?: string | null
          Postcode?: string | null
          Pregnant?: boolean | null
          "Referral Source"?: string | null
          Religion?: string | null
          "Sexual Orientation"?: string | null
          Signed?: boolean | null
          Town?: string | null
          UniqueId?: string | null
          "Updated At"?: string | null
        }
        Update: {
          "Acupuncture Data"?: boolean | null
          "Auto ID"?: number
          Carer?: boolean | null
          ClientAgreementSigned?: boolean | null
          "Created At"?: string | null
          DateOfBirth?: string | null
          Disability?: boolean | null
          Email?: string | null
          Epilepsy?: boolean | null
          "Equality Opt Out"?: Json | null
          "Ethnic Origin"?: string | null
          FirstName?: string | null
          "Full Name"?: string | null
          Gender?: string | null
          "Give Blood"?: boolean | null
          Haemophilia?: boolean | null
          Id?: number | null
          "Joined Date"?: string | null
          LastName?: string | null
          "Marital Status"?: string | null
          "Marketing Opt Out"?: boolean | null
          "Other Support"?: string | null
          OtherInfo?: string | null
          Pacemaker?: boolean | null
          Phone?: string | null
          Postcode?: string | null
          Pregnant?: boolean | null
          "Referral Source"?: string | null
          Religion?: string | null
          "Sexual Orientation"?: string | null
          Signed?: boolean | null
          Town?: string | null
          UniqueId?: string | null
          "Updated At"?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          isAdmin: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          isAdmin?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          isAdmin?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      service: {
        Row: {
          "Auto ID": number
          "Created At": string | null
          "Is Current": boolean | null
          Multi: boolean | null
          Name: string | null
          "Updated At": string | null
        }
        Insert: {
          "Auto ID"?: number
          "Created At"?: string | null
          "Is Current"?: boolean | null
          Multi?: boolean | null
          Name?: string | null
          "Updated At"?: string | null
        }
        Update: {
          "Auto ID"?: number
          "Created At"?: string | null
          "Is Current"?: boolean | null
          Multi?: boolean | null
          Name?: string | null
          "Updated At"?: string | null
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
