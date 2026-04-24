export type Procedure = {
  id: string
  name: string
  duration: number // minutos
  price: number
  description?: string
  active: boolean
  created_at: string
}

export type Client = {
  id: string
  name: string
  phone: string
  email?: string
  notes?: string
  created_at: string
}

export type Booking = {
  id: string
  client_id: string
  procedure_id: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  google_event_id?: string
  payment_status?: 'pending' | 'paid'
  notes?: string
  created_at: string
}

export type WorkingHours = {
  id: string
  day_of_week: number // 0-6 (domingo a sábado)
  start_time: string // HH:mm
  end_time: string   // HH:mm
  active: boolean
}

export type TimeSlot = {
  start: string
  end: string
  available: boolean
}
