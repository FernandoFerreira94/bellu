'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { sb } from '@/lib/supabase-browser'
import type { Service } from '@/types'

function mapRow(r: Record<string, unknown>): Service {
  return {
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) ?? null,
    durationInMinutes: r.duration as number,
    price: Number(r.price),
    isActive: r.active as boolean,
    belluEnabled: r.luna_enabled as boolean,
    color: null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}

export function useServices() {
  return useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('procedures')
        .select('id, name, description, duration, price, active, luna_enabled, created_at, updated_at')
        .order('name')
      if (error) throw error
      return (data ?? []).map(mapRow)
    },
  })
}

type ServiceInput = {
  name: string
  description?: string | null
  durationInMinutes: number
  price: number
  belluEnabled: boolean
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ServiceInput) => {
      const { error } = await sb.from('procedures').insert({
        name: input.name,
        description: input.description ?? null,
        duration: input.durationInMinutes,
        price: input.price,
        active: true,
        luna_enabled: input.belluEnabled,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Serviço criado!')
    },
    onError: () => toast.error('Erro ao criar serviço'),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: ServiceInput & { id: string }) => {
      const { error } = await sb.from('procedures').update({
        name: input.name,
        description: input.description ?? null,
        duration: input.durationInMinutes,
        price: input.price,
        luna_enabled: input.belluEnabled,
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Serviço atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar serviço'),
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('procedures').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Serviço excluído')
    },
    onError: () => toast.error('Erro ao excluir serviço'),
  })
}
