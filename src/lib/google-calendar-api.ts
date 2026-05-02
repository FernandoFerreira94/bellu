// src/lib/google-calendar-api.ts
import { getValidAccessToken } from '@/lib/google-token'

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3'

export interface GCalEvent {
  id: string
  summary?: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  status?: string
}

export async function fetchGoogleCalendarEvents(params: {
  timeMin: string
  timeMax?: string
  maxResults?: number
}): Promise<GCalEvent[]> {
  const token = await getValidAccessToken()
  if (!token) return []

  const query = new URLSearchParams({
    timeMin: params.timeMin,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(params.maxResults ?? 500),
  })
  if (params.timeMax) query.set('timeMax', params.timeMax)

  const res = await fetch(
    `${GCAL_BASE}/calendars/primary/events?${query.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )

  if (!res.ok) return []
  const data = await res.json()
  return (data.items ?? []) as GCalEvent[]
}

export async function createGCalEvent(params: {
  summary: string
  start: string
  end: string
}): Promise<string | null> {
  const token = await getValidAccessToken()
  if (!token) return null

  const res = await fetch(`${GCAL_BASE}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: params.summary,
      start: { dateTime: params.start, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: params.end, timeZone: 'America/Sao_Paulo' },
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.id ?? null
}

export async function updateGCalEvent(params: {
  eventId: string
  summary: string
  start: string
  end: string
}): Promise<void> {
  const token = await getValidAccessToken()
  if (!token) return

  const res = await fetch(`${GCAL_BASE}/calendars/primary/events/${params.eventId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: params.summary,
      start: { dateTime: params.start, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: params.end, timeZone: 'America/Sao_Paulo' },
    }),
  })

  if (!res.ok) {
    console.error(`[GCal] updateGCalEvent falhou: ${res.status} ${params.eventId}`)
  }
}

export async function deleteGCalEvent(eventId: string): Promise<void> {
  const token = await getValidAccessToken()
  if (!token) return

  const res = await fetch(`${GCAL_BASE}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok && res.status !== 410) {
    // 410 Gone = evento já deletado no Google — ignorar
    console.error(`[GCal] deleteGCalEvent falhou: ${res.status} ${eventId}`)
  }
}

export async function registerGCalWebhook(params: {
  channelId: string
  callbackUrl: string
}): Promise<{ expiration: string; resourceId: string } | null> {
  const token = await getValidAccessToken()
  if (!token) return null

  const res = await fetch(`${GCAL_BASE}/calendars/primary/events/watch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: params.channelId,
      type: 'web_hook',
      address: params.callbackUrl,
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  return {
    expiration: data.expiration as string,
    resourceId: (res.headers.get('x-goog-resource-id') ?? (data as Record<string, string>).resourceId ?? '') as string,
  }
}
