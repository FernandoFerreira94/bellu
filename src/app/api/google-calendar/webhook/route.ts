import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchGoogleCalendarEvents } from '@/lib/google-calendar-api'

export async function POST(request: Request) {
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

    for (const ev of events) {
      if (!ev.start.dateTime) continue // eventos de dia inteiro — ignorar
      await supabase.from('google_calendar_events').upsert({
        user_id: tokenRow.user_id,
        google_event_id: ev.id,
        title: ev.summary ?? 'Sem título',
        start_time: ev.start.dateTime,
        end_time: ev.end.dateTime ?? ev.start.dateTime,
        is_personal: true, // webhook só traz eventos externos
      }, { onConflict: 'user_id,google_event_id' })
    }
  } catch (err) {
    console.error('[GCal Webhook] Erro ao sincronizar:', err)
  }

  return new NextResponse(null, { status: 200 })
}
