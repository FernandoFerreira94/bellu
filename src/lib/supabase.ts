import { createClient } from "@supabase/supabase-js";

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
      blocks: {
        Row: {
          created_at: string
          end_time: string
          google_event_id: string | null
          id: string
          reason: string | null
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          google_event_id?: string | null
          id?: string
          reason?: string | null
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          google_event_id?: string | null
          id?: string
          reason?: string | null
          start_time?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          client_id: string
          created_at: string
          end_time: string
          google_event_id: string | null
          id: string
          notes: string | null
          payment_status: string | null
          procedure_id: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_time: string
          google_event_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          procedure_id: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_time?: string
          google_event_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          procedure_id?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          booking_id: string | null
          client_id: string | null
          content: string
          created_at: string
          direction: string
          id: string
          phone: string
          sent_at: string | null
          status: string
        }
        Insert: {
          booking_id?: string | null
          client_id?: string | null
          content: string
          created_at?: string
          direction: string
          id?: string
          phone: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          booking_id?: string | null
          client_id?: string | null
          content?: string
          created_at?: string
          direction?: string
          id?: string
          phone?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration: number
          id: string
          luna_enabled: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration: number
          id?: string
          luna_enabled?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          luna_enabled?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      studio_profile: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          onboarding_completed: boolean
          owner_name: string
          specialty: string
          studio_name: string
        }
        Insert: {
          created_at?: string
          id: string
          logo_url?: string | null
          onboarding_completed?: boolean
          owner_name: string
          specialty?: string
          studio_name: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          onboarding_completed?: boolean
          owner_name?: string
          specialty?: string
          studio_name?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          payment_method: string | null
          type: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          payment_method?: string | null
          type: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          payment_method?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      google_tokens: {
        Row: {
          id: string
          user_id: string
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          active: boolean
          day_of_week: number
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          active?: boolean
          day_of_week: number
          end_time?: string
          id?: string
          start_time?: string
        }
        Update: {
          active?: boolean
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = () =>
  createClient<Database>(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
