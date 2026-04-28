import { createClient } from "@supabase/supabase-js";

import type {
  CalendarEvent,
  Client,
  FinanceEntry,
  Service,
  Settings,
  StudioProfile,
  WhatsAppSession,
  WorkingHours,
} from "@/types";

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "createdAt" | "updatedAt" | "stats">;
        Update: Partial<
          Omit<Client, "id" | "createdAt" | "updatedAt" | "stats">
        >;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, "id" | "createdAt" | "updatedAt">;
        Update: Partial<Omit<Service, "id" | "createdAt" | "updatedAt">>;
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">;
        Update: Partial<
          Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">
        >;
      };
      finance_entries: {
        Row: FinanceEntry;
        Insert: Omit<FinanceEntry, "id" | "createdAt" | "updatedAt">;
        Update: Partial<Omit<FinanceEntry, "id" | "createdAt" | "updatedAt">>;
      };
      working_hours: {
        Row: WorkingHours;
        Insert: Omit<WorkingHours, "id">;
        Update: Partial<Omit<WorkingHours, "id">>;
      };
      settings: {
        Row: Settings;
        Insert: Settings;
        Update: Partial<Settings>;
      };
      whatsapp_sessions: {
        Row: WhatsAppSession;
        Insert: Omit<WhatsAppSession, "updatedAt">;
        Update: Partial<Omit<WhatsAppSession, "updatedAt">>;
      };
      studio_profile: {
        Row: StudioProfile;
        Insert: Omit<StudioProfile, 'created_at'>;
        Update: Partial<Omit<StudioProfile, 'id' | 'created_at'>>;
      };
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = () =>
  createClient<Database>(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
