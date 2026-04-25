import { createClient } from '@supabase/supabase-js'
import type {
  Procedure,
  Client,
  Booking,
  WorkingHours,
  Block,
  Transaction,
  Message,
} from '@/types'

// Tipo do banco para o cliente Supabase — mapeia tabelas para Row/Insert/Update
export type Database = {
  public: {
    Tables: {
      procedures: {
        Row: Procedure
        Insert: Omit<Procedure, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Procedure, 'id'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id'>>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'client' | 'procedure'>
        Update: Partial<Omit<Booking, 'id' | 'client' | 'procedure'>>
      }
      working_hours: {
        Row: WorkingHours
        Insert: Omit<WorkingHours, 'id'>
        Update: Partial<Omit<WorkingHours, 'id'>>
      }
      blocks: {
        Row: Block
        Insert: Omit<Block, 'id' | 'created_at'>
        Update: Partial<Omit<Block, 'id'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at'>
        Update: Partial<Omit<Transaction, 'id'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id'>>
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente público — usado nos componentes client-side e Server Components
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Cliente admin — usar apenas em Server Actions e API Routes (chave service role)
export const supabaseAdmin = () =>
  createClient<Database>(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
