export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      attendance: {
        Row: {
          Date: string | null
          "Person Id": number
          "Person Name": string | null
          ServiceName: string | null
          "Auto ID": number
          "Created At": string | null
          "Updated At": string | null
        }
        Insert: {
          Date?: string | null
          "Person Id": number
          "Person Name"?: string | null
          ServiceName?: string | null
          "Auto ID"?: number
          "Created At"?: string | null
          "Updated At"?: string | null
        }
        Update: {
          Date?: string | null
          "Person Id"?: number
          "Person Name"?: string | null
          ServiceName?: string | null
          "Auto ID"?: number
          "Created At"?: string | null
          "Updated At"?: string | null
        }
      }
      people: {
        Row: {
          "Auto ID": number | null
          "Created At": string | null
          "Updated At": string | null
          Id: number
          "Referral Source": string | null
          "Equality Opt Out": Json | null
          Gender: string | null
          Town: string | null
          Postcode: string | null
          "Other Support": string | null
          "Marketing Opt Out": string | null
          FirstName: string | null
          LastName: string | null
          DateOfBirth: string | null
          Phone: string | null
          Email: string | null
          UniqueId: string | null
          OtherInfo: string | null
          Religion: string | null
          "Ethnic Origin": string | null
          "Sexual Orientation": string | null
          "Marital Status": string | null
          Carer: string | null
          Disability: string | null
          ClientAgreementSigned: string | null
          "Joined Date": string | null
          "Acupuncture Data": Json | null
          Haemophilia: string | null
          Pregnant: Json | null
          "Give Blood": string | null
          Signed: Json | null
          "Full Name": string | null
        }
        Insert: {
          "Auto ID"?: number | null
          "Created At"?: string | null
          "Updated At"?: string | null
          Id?: number
          "Referral Source"?: string | null
          "Equality Opt Out"?: Json | null
          Gender?: string | null
          Town?: string | null
          Postcode?: string | null
          "Other Support"?: string | null
          "Marketing Opt Out"?: string | null
          FirstName?: string | null
          LastName?: string | null
          DateOfBirth?: string | null
          Phone?: string | null
          Email?: string | null
          UniqueId?: string | null
          OtherInfo?: string | null
          Religion?: string | null
          "Ethnic Origin"?: string | null
          "Sexual Orientation"?: string | null
          "Marital Status"?: string | null
          Carer?: string | null
          Disability?: string | null
          ClientAgreementSigned?: string | null
          "Joined Date"?: string | null
          "Acupuncture Data"?: Json | null
          Haemophilia?: string | null
          Pregnant?: Json | null
          "Give Blood"?: string | null
          Signed?: Json | null
          "Full Name"?: string | null
        }
        Update: {
          "Auto ID"?: number | null
          "Created At"?: string | null
          "Updated At"?: string | null
          Id?: number
          "Referral Source"?: string | null
          "Equality Opt Out"?: Json | null
          Gender?: string | null
          Town?: string | null
          Postcode?: string | null
          "Other Support"?: string | null
          "Marketing Opt Out"?: string | null
          FirstName?: string | null
          LastName?: string | null
          DateOfBirth?: string | null
          Phone?: string | null
          Email?: string | null
          UniqueId?: string | null
          OtherInfo?: string | null
          Religion?: string | null
          "Ethnic Origin"?: string | null
          "Sexual Orientation"?: string | null
          "Marital Status"?: string | null
          Carer?: string | null
          Disability?: string | null
          ClientAgreementSigned?: string | null
          "Joined Date"?: string | null
          "Acupuncture Data"?: Json | null
          Haemophilia?: string | null
          Pregnant?: Json | null
          "Give Blood"?: string | null
          Signed?: Json | null
          "Full Name"?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
      }
      service: {
        Row: {
          "Auto ID": number
          Name: string | null
          "Is Current": boolean | null
          "Created At": string | null
          "Updated At": string | null
        }
        Insert: {
          "Auto ID": number
          Name?: string | null
          "Is Current"?: boolean | null
          "Created At"?: string | null
          "Updated At"?: string | null
        }
        Update: {
          "Auto ID"?: number
          Name?: string | null
          "Is Current"?: boolean | null
          "Created At"?: string | null
          "Updated At"?: string | null
        }
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
  }
}
