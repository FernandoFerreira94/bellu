import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchGoogleCalendarEvents } from '@/lib/google-calendar-api'

export async function POST(request: Request) {
  // Verificar token do canal para autenticar requisição do Google
  const channelToken = request.headers.get('x-goog-channel-token')
  if (channelToken && channelToken !== process.env.GCAL_WEBHOOK_SECRET) {
    return new NextResponse(null, { status: 200 }) // 200 para Google não retentar
  }

  // Google envia headers, não body com eventos
  const resourceState = request.headers.get('x-goog-resource-state')
  if (resourceState === 'sync') {
    // Primeiro ping do Google ao registrar webhook — ignorar
    return new NextResponse(null, { status: 200 })
  }

  const supabase = await createSupabaseServerClient()

  // Buscar usuário pelo channel registrado
  // Por simplicidade: buscar todos os usuários com google_tokens e resync
  // (sistema single-user — sempre 1 usuário)
  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('user_id')
    .maybeSingle()

  if (!tokenRow) return new NextResponse(null, { status: 200 })

  // Re-fetch eventos das próximas 2 semanas para atualizar
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  
  try {
    const events = await fetchGoogleCalendarEvents({ timeMin, timeMax, maxResults: 100 })

    // Buscar registros existentes para preservar is_personal
    const eventIds = events.map((e) => e.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('google_calendar_events')
      .select('google_event_id, is_personal')
      .in('google_event_id', eventIds) as { data: { google_event_id: string; is_personal: boolean }[] | null }

    const existingMap = new Map((existing ?? []).map((r) => [r.google_event_id, r.is_personal]))

    for (const ev of events) {
      if (!ev.start.dateTime) continue // eventos de dia inteiro — ignorar
      // Preservar is_personal se já existe (bookings espelhados = false)
      const isPersonal = existingMap.has(ev.id) ? existingMap.get(ev.id)! : true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('google_calendar_events').upsert({
        user_id: tokenRow.user_id,
        google_event_id: ev.id,
        title: ev.summary ?? 'Sem título',
        start_time: ev.start.dateTime,
        end_time: ev.end.dateTime ?? ev.start.dateTime,
        is_personal: isPersonal,
      }, { onConflict: 'user_id,google_event_id' })
    }
  } catch (err) {
    console.error('[GCal Webhook] Erro ao sincronizar:', err)
  }

  return new NextResponse(null, { status: 200 })
}
