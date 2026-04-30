'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { sb } from '@/lib/supabase-browser'

export type Booking = {
  id: string
  clientId: string
  procedureId: string
  startTime: string   // ISO string
  endTime: string     // ISO string
  status: 'confirmed' | 'cancelled' | 'no_show'
  notes: string | null
  paymentStatus: string | null
  // joined
  clientName?: string
  procedureName?: string
}

function mapRow(r: Record<string, unknown>): Booking {
  const client = r.clients as Record<string, unknown> | null
  const procedure = r.procedures as Record<string, unknown> | null
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    procedureId: r.procedure_id as string,
    startTime: r.start_time as string,
    endTime: r.end_time as string,
    status: r.status as Booking['status'],
    notes: (r.notes as string) ?? null,
    paymentStatus: (r.payment_status as string) ?? null,
    clientName: (client?.name as string) ?? undefined,
    procedureName: (procedure?.name as string) ?? undefined,
  }
}

export function useBookings(from: Date, to: Date) {
  return useQuery<Booking[]>({
    queryKey: ['bookings', from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const { data, error } = await sb
        .from('bookings')
        .select('*, clients(name), procedures(name)')
        .gte('start_time', from.toISOString())
        .lte('start_time', to.toISOString())
        .neq('status', 'cancelled')
        .order('start_time')
      if (error) throw error
      return (data ?? []).map(mapRow)
    },
  })
}

type CreateBookingInput = {
  clientId: string
  procedureId: string
  startTime: Date
  endTime: Date
  notes?: string | null
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { error } = await sb.from('bookings').insert({
        client_id: input.clientId,
        procedure_id: input.procedureId,
        start_time: input.startTime.toISOString(),
        end_time: input.endTime.toISOString(),
        notes: input.notes ?? null,
        status: 'confirmed',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Agendamento criado!')
    },
    onError: () => toast.error('Erro ao criar agendamento'),
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('bookings').update({ status: 'cancelled' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Agendamento cancelado')
    },
    onError: () => toast.error('Erro ao cancelar'),
  })
}
