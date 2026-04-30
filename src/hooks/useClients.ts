'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Client } from '@/types'
import { sb } from '@/lib/supabase-browser'

function mapRow(r: Record<string, unknown>): Client {
  return {
    id: r.id as string,
    name: r.name as string,
    phone: r.phone as string,
    email: (r.email as string) ?? null,
    birthDate: null,
    notes: (r.notes as string) ?? null,
    tags: [],
    lastVisitAt: null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('clients')
        .select('id, name, phone, email, notes, created_at, updated_at')
        .order('name')
      if (error) throw error
      return (data ?? []).map(mapRow)
    },
  })
}

type ClientInput = { name: string; phone: string; email?: string | null; notes?: string | null }

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ClientInput) => {
      const { error } = await sb.from('clients').insert({
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        notes: input.notes ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente cadastrado!')
    },
    onError: () => toast.error('Erro ao cadastrar cliente'),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: ClientInput & { id: string }) => {
      const { error } = await sb.from('clients').update({
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        notes: input.notes ?? null,
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar cliente'),
  })
}
