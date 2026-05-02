import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createGCalEvent, updateGCalEvent, deleteGCalEvent } from '@/lib/google-calendar-api'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await request.json()
  const { clientId, procedureId, startTime, endTime, notes } = body

  // 1. Criar no Supabase
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      client_id: clientId,
      procedure_id: procedureId,
      start_time: startTime,
      end_time: endTime,
      notes: notes ?? null,
      status: 'confirmed',
    })
    .select('*, clients(name), procedures(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 2. Espelhar no Google Calendar
  try {
    const clientName = booking.clients?.name ?? 'Cliente'
    const procedureName = booking.procedures?.name ?? 'Serviço'
    
    const gcalEventId = await createGCalEvent({
      summary: `Atendimento: ${clientName} — ${procedureName}`,
      start: startTime,
      end: endTime,
    })

    if (gcalEventId) {
      await supabase
        .from('bookings')
        .update({ google_calendar_event_id: gcalEventId })
        .eq('id', booking.id)
    }
  } catch (err) {
    console.error('[GCal] Erro ao criar evento:', err)
  }

  return NextResponse.json(booking)
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await request.json()
  const { id, status, startTime, endTime, notes } = body

  // 1. Buscar booking atual para pegar o gcal_id e nomes
  const { data: existing } = await supabase
    .from('bookings')
    .select('*, clients(name), procedures(name)')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Booking não encontrado' }, { status: 404 })

  // 2. Atualizar no Supabase
  const { data: updated, error } = await supabase
    .from('bookings')
    .update({
      status: status ?? existing.status,
      start_time: startTime ?? existing.start_time,
      end_time: endTime ?? existing.end_time,
      notes: notes !== undefined ? notes : existing.notes,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 3. Espelhar no Google Calendar
  try {
    const gcalId = existing.google_calendar_event_id
    if (gcalId) {
      if (status === 'cancelled') {
        await deleteGCalEvent(gcalId)
      } else {
        const clientName = existing.clients?.name ?? 'Cliente'
        const procedureName = existing.procedures?.name ?? 'Serviço'
        
        await updateGCalEvent({
          eventId: gcalId,
          summary: `Atendimento: ${clientName} — ${procedureName}`,
          start: startTime ?? existing.start_time,
          end: endTime ?? existing.end_time,
        })
      }
    }
  } catch (err) {
    console.error('[GCal] Erro ao atualizar/deletar evento:', err)
  }

  return NextResponse.json(updated)
}
