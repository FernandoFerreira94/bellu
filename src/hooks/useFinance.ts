'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { sb } from '@/lib/supabase-browser'

export type Transaction = {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string | null
  date: string
  payment_method: string | null
  booking_id: string | null
  created_at: string
}

export function useTransactions(from: Date, to: Date) {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const { data, error } = await sb
        .from('transactions')
        .select('id, type, amount, description, date, payment_method, booking_id, created_at')
        .gte('date', from.toISOString().split('T')[0])
        .lte('date', to.toISOString().split('T')[0])
        .order('date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Transaction[]
    },
  })
}
