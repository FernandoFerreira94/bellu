// src/app/api/google-calendar/sync-events/route.ts
// Sync simples: busca eventos GCal → salva em google_calendar_events (sem IA)
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchGoogleCalendarEvents } from '@/lib/google-calendar-api'

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Busca eventos dos próximos 60 dias
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

  const events = await fetchGoogleCalendarEvents({ timeMin, timeMax, maxResults: 250 })

  if (!events.length) {
    return NextResponse.json({ synced: 0 })
  }

  const rows = events
    .filter((e) => e.status !== 'cancelled')
    .map((e) => ({
      google_event_id: e.id,
      user_id: user.id,
      title: e.summary ?? '(sem título)',
      start_time: e.start.dateTime ?? e.start.date ?? '',
      end_time: e.end.dateTime ?? e.end.date ?? '',
      is_personal: true,
    }))
    .filter((r) => r.start_time && r.end_time)

  const { error } = await supabase
    .from('google_calendar_events')
    .upsert(rows, { onConflict: 'google_event_id' })

  if (error) {
    console.error('[sync-events]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ synced: rows.length })
}
