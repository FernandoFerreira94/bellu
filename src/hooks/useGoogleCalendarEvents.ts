// src/hooks/useGoogleCalendarEvents.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { sb } from '@/lib/supabase-browser'

export interface GoogleCalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  is_personal: boolean
}

export function useGoogleCalendarEvents(from: string, to: string) {
  return useQuery<GoogleCalendarEvent[]>({
    queryKey: ['google-calendar-events', from, to],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (sb as any)
        .from('google_calendar_events')
        .select('id, title, start_time, end_time, is_personal')
        .gte('start_time', from)
        .lte('start_time', to)
        .eq('is_personal', true)
        .order('start_time') as { data: GoogleCalendarEvent[] | null; error: unknown }
      if (error) return []
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}
