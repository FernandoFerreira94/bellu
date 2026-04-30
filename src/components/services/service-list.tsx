'use client'

import { useState } from 'react'
import { Plus, Clock, Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ServiceSheet } from './service-sheet'
import { useServices } from '@/hooks/useServices'
import type { Service } from '@/types'

function formatPrice(price: number) {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m}min` : `${h}h`
}

export function ServiceList() {
  const { data: services, isLoading } = useServices()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<'add' | 'edit'>('add')
  const [selected, setSelected] = useState<Service | null>(null)

  function openAdd() {
    setSelected(null)
    setSheetMode('add')
    setSheetOpen(true)
  }

  function openEdit(service: Service) {
    setSelected(service)
    setSheetMode('edit')
    setSheetOpen(true)
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-400">{services?.length ?? 0} serviços</p>
        <Button
          onClick={openAdd}
          size="sm"
          className="rounded-2xl bg-primary hover:bg-primary/90 text-white text-xs gap-1.5 px-3 h-8"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-stone-100 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : !services?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-3">
            <Scissors className="w-6 h-6 text-stone-400" />
          </div>
          <p className="text-sm text-stone-500">Nenhum serviço cadastrado</p>
          <button onClick={openAdd} className="mt-2 text-xs text-rose-400 hover:text-rose-500 transition-colors">
            Criar primeiro serviço
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => openEdit(service)}
              className="flex items-center gap-3 w-full bg-white rounded-2xl px-4 py-3.5 border border-stone-100 hover:border-rose-100 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Scissors className="w-4 h-4 text-rose-300" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{service.name}</p>
                {service.description && (
                  <p className="text-xs text-stone-400 truncate mt-0.5">{service.description}</p>
                )}
              </div>

              <div className="flex flex-col items-end shrink-0 gap-0.5">
                <span className="text-sm font-semibold text-stone-800">{formatPrice(service.price)}</span>
                <span className="flex items-center gap-1 text-xs text-stone-400">
                  <Clock className="w-3 h-3" />
                  {formatDuration(service.durationInMinutes)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <ServiceSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        service={selected}
      />
    </div>
  )
}
