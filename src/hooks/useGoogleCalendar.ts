'use client'

import { useQuery } from '@tanstack/react-query'

import type { CalendarEvent } from '@/types'

export function useGoogleCalendar() {
  return useQuery<CalendarEvent[]>({
    queryKey: ['google-calendar', 'events'],
    queryFn: async () => [],
    enabled: false,
  })
}
