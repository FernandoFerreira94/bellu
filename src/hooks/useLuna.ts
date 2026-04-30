'use client'

import { useQuery } from '@tanstack/react-query'

import type { LunaMessage } from '@/types'

export function useLuna() {
  return useQuery<LunaMessage[]>({
    queryKey: ['luna', 'messages'],
    queryFn: async () => [],
    enabled: false,
  })
}
