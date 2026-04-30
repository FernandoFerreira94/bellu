// src/lib/luna-tools.ts
import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const slotsParams = z.object({
  date: z.string().describe('Data no formato YYYY-MM-DD'),
  procedure_id: z.string().uuid().describe('ID do procedimento'),
})

const bookingsParams = z.object({
  from: z.string().describe('Data início YYYY-MM-DD'),
  to: z.string().describe('Data fim YYYY-MM-DD'),
})

const createBookingParams = z.object({
  client_id: z.string().uuid().describe('ID da cliente'),
  procedure_id: z.string().uuid().describe('ID do procedimento'),
  start_time: z.string().describe('Horário de início no formato ISO 8601, ex: 2026-05-01T09:00:00'),
})

const cancelBookingParams = z.object({
  booking_id: z.string().uuid().describe('ID do agendamento'),
})

const clientsParams = z.object({
  search: z.string().optional().describe('Texto para buscar por nome ou telefone (opcional)'),
})

const financialParams = z.object({
  from: z.string().describe('Data início YYYY-MM-DD'),
  to: z.string().describe('Data fim YYYY-MM-DD'),
})

export const lunaTools = {
  get_available_slots: tool({
    description: 'Retorna horários disponíveis para um procedimento em uma data específica',
    parameters: slotsParams,
    execute: async ({ date, procedure_id }: z.infer<typeof slotsParams>) => {
      const supabase = await createSupabaseServerClient()

      const { data: procedure } = await supabase
        .from('procedures')
        .select('duration, name')
        .eq('id', procedure_id)
        .single()
      if (!procedure) return { error: 'Procedimento não encontrado' }

      // 0 = Sunday, 1 = Monday, ...
      const dayOfWeek = new Date(`${date}T12:00:00`).getDay()
      const { data: wh } = await supabase
        .from('working_hours')
        .select('start_time, end_time, active')
        .eq('day_of_week', dayOfWeek)
        .single()
      if (!wh || !wh.active) {
        return { slots: [], reason: 'Sem expediente neste dia' }
      }

      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .gte('start_time', `${date}T00:00:00+00:00`)
        .lte('start_time', `${date}T23:59:59+00:00`)
        .neq('status', 'cancelled')

      const [sh, sm] = wh.start_time.split(':').map(Number)
      const [eh, em] = wh.end_time.split(':').map(Number)
      const startMin = sh * 60 + sm
      const endMin = eh * 60 + em
      const BUFFER = 30
      const slots: string[] = []

      for (let t = startMin; t + procedure.duration + BUFFER <= endMin; t += 30) {
        const hh = String(Math.floor(t / 60)).padStart(2, '0')
        const mm = String(t % 60).padStart(2, '0')
        const slotStartMs = new Date(`${date}T${hh}:${mm}:00`).getTime()
        const slotEndMs = slotStartMs + (procedure.duration + BUFFER) * 60_000

        const conflict = (bookings ?? []).some((b) => {
          const bs = new Date(b.start_time).getTime() - BUFFER * 60_000
          const be = new Date(b.end_time).getTime() + BUFFER * 60_000
          return slotStartMs < be && slotEndMs > bs
        })

        if (!conflict) slots.push(`${hh}:${mm}`)
      }

      return { date, procedure: procedure.name, duration: procedure.duration, slots }
    },
  }),

  get_bookings: tool({
    description: 'Retorna agendamentos em um período',
    parameters: bookingsParams,
    execute: async ({ from, to }: z.infer<typeof bookingsParams>) => {
      const supabase = await createSupabaseServerClient()
      const { data, error } = await supabase
        .from('bookings')
        .select('id, start_time, end_time, status, notes, clients(name, phone), procedures(name, duration, price)')
        .gte('start_time', `${from}T00:00:00+00:00`)
        .lte('start_time', `${to}T23:59:59+00:00`)
        .neq('status', 'cancelled')
        .order('start_time')
      if (error) return { error: error.message }
      return data ?? []
    },
  }),

  create_booking: tool({
    description: 'Cria um agendamento para uma cliente. Confirme com a profissional antes de chamar.',
    parameters: createBookingParams,
    execute: async ({ client_id, procedure_id, start_time }: z.infer<typeof createBookingParams>) => {
      const supabase = await createSupabaseServerClient()

      const { data: procedure } = await supabase
        .from('procedures')
        .select('duration')
        .eq('id', procedure_id)
        .single()
      if (!procedure) return { error: 'Procedimento não encontrado' }

      const startDate = new Date(start_time)
      const endDate = new Date(startDate.getTime() + procedure.duration * 60_000)

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          client_id,
          procedure_id,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          status: 'confirmed',
        })
        .select('id, start_time, end_time')
        .single()

      if (error) return { error: error.message }
      return { success: true, booking: data }
    },
  }),

  cancel_booking: tool({
    description: 'Cancela um agendamento por ID. Confirme com a profissional antes de chamar.',
    parameters: cancelBookingParams,
    execute: async ({ booking_id }: z.infer<typeof cancelBookingParams>) => {
      const supabase = await createSupabaseServerClient()
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking_id)
      if (error) return { error: error.message }
      return { success: true }
    },
  }),

  get_clients: tool({
    description: 'Busca clientes por nome ou telefone',
    parameters: clientsParams,
    execute: async ({ search }: z.infer<typeof clientsParams>) => {
      const supabase = await createSupabaseServerClient()
      let query = supabase
        .from('clients')
        .select('id, name, phone, email')
        .order('name')
        .limit(10)
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
      }
      const { data, error } = await query
      if (error) return { error: error.message }
      return data ?? []
    },
  }),

  get_financial_summary: tool({
    description: 'Retorna resumo financeiro (receita, despesas, lucro) de um período',
    parameters: financialParams,
    execute: async ({ from, to }: z.infer<typeof financialParams>) => {
      const supabase = await createSupabaseServerClient()
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .gte('date', from)
        .lte('date', to)
      if (error) return { error: error.message }

      const rows = data ?? []
      const totalIncome = rows
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + Number(t.amount), 0)
      const totalExpenses = rows
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + Number(t.amount), 0)

      return {
        period: `${from} a ${to}`,
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
      }
    },
  }),
}
