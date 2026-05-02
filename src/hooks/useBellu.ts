'use client'

import { useQuery } from '@tanstack/react-query'

import type { BelluMessage } from '@/types'

export function useBellu() {
  return useQuery<BelluMessage[]>({
    queryKey: ['bellu', 'messages'],
    queryFn: async () => [],
    enabled: false,
  })
}
