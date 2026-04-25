// ============================================================
// Types — Ayumi Nails
// ============================================================

export type Procedure = {
  id: string
  name: string
  duration: number   // minutos
  price: number
  description?: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type Client = {
  id: string
  name: string
  phone: string
  email?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export type Booking = {
  id: string
  client_id: string
  procedure_id: string
  start_time: string
  end_time: string
  status: BookingStatus
  google_event_id?: string | null
  payment_status?: PaymentStatus | null
  notes?: string | null
  created_at: string
  updated_at: string
  // relações opcionais (quando joined)
  client?: Client
  procedure?: Procedure
}

export type WorkingHours = {
  id: string
  day_of_week: number  // 0=Dom … 6=Sáb
  start_time: string   // HH:mm
  end_time: string     // HH:mm
  active: boolean
}

export type Block = {
  id: string
  start_time: string
  end_time: string
  reason?: string | null
  google_event_id?: string | null
  created_at: string
}

export type TransactionType = 'income' | 'expense'
export type PaymentMethod = 'pix' | 'cash' | 'credit' | 'debit' | 'mp'

export type Transaction = {
  id: string
  booking_id?: string | null
  type: TransactionType
  amount: number
  description: string
  date: string
  payment_method?: PaymentMethod | null
  created_at: string
}

export type MessageDirection = 'outbound' | 'inbound'
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed'

export type Message = {
  id: string
  booking_id?: string | null
  client_id?: string | null
  phone: string
  content: string
  direction: MessageDirection
  status: MessageStatus
  sent_at?: string | null
  created_at: string
}

export type TimeSlot = {
  start: string  // ISO string
  end: string    // ISO string
  available: boolean
}

// ============================================================
// Input types (para forms e API)
// ============================================================
// Importar Zod em cada form para validação em runtime

export type CreateBookingInput = {
  client_name: string
  client_phone: string
  client_email?: string
  procedure_id: string
  start_time: string
  notes?: string
}

export type CreateProcedureInput = {
  name: string
  duration: number
  price: number
  description?: string
}
