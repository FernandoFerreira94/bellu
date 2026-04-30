'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ClientSheet } from './client-sheet'
import { useClients } from '@/hooks/useClients'
import type { Client } from '@/types'

function initials(name: string) {
  return name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function statusTag(client: Client) {
  if (!client.lastVisitAt) return { label: 'Nova', color: 'bg-purple-50 text-purple-500' }
  const days = Math.floor((Date.now() - new Date(client.lastVisitAt).getTime()) / 86_400_000)
  if (days <= 45) return { label: 'Frequente', color: 'bg-emerald-50 text-emerald-600' }
  if (days <= 90) return { label: 'Regular', color: 'bg-amber-50 text-amber-600' }
  return { label: 'Inativa', color: 'bg-stone-100 text-stone-500' }
}

export function ClientList() {
  const { data: clients, isLoading } = useClients()
  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<'add' | 'view'>('add')
  const [selected, setSelected] = useState<Client | null>(null)

  const filtered = useMemo(() => {
    if (!clients) return []
    const q = search.toLowerCase()
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    )
  }, [clients, search])

  function openAdd() {
    setSelected(null)
    setSheetMode('add')
    setSheetOpen(true)
  }

  function openView(client: Client) {
    setSelected(client)
    setSheetMode('view')
    setSheetOpen(true)
  }

  return (
    <div className="space-y-3">
      {/* Barra de busca + botão */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="pl-9 rounded-2xl border-stone-200 bg-white focus-visible:ring-rose-200 text-sm"
          />
        </div>
        <Button
          onClick={openAdd}
          size="icon"
          className="shrink-0 rounded-2xl w-10 h-10 bg-primary hover:bg-primary/90 text-white shadow-sm"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-stone-100">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-3">
            <User className="w-6 h-6 text-stone-400" />
          </div>
          <p className="text-sm text-stone-500">
            {search ? 'Nenhuma cliente encontrada' : 'Nenhuma cliente cadastrada'}
          </p>
          {!search && (
            <button onClick={openAdd} className="mt-2 text-xs text-rose-400 hover:text-rose-500 transition-colors">
              Cadastrar primeira cliente
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => {
            const tag = statusTag(client)
            return (
              <button
                key={client.id}
                onClick={() => openView(client)}
                className="flex items-center gap-3 w-full bg-white rounded-2xl px-4 py-3.5 border border-stone-100 hover:border-rose-100 hover:shadow-sm transition-all text-left"
              >
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback className="bg-rose-50 text-rose-400 text-xs font-medium">
                    {initials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{client.name}</p>
                  <p className="text-xs text-stone-400 truncate">{client.phone}</p>
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${tag.color}`}>
                  {tag.label}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <ClientSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        client={selected}
      />
    </div>
  )
}
