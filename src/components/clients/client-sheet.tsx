'use client'

import { useState, useEffect } from 'react'
import { Phone, Mail, FileText, User } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useCreateClient, useUpdateClient } from '@/hooks/useClients'
import type { Client } from '@/types'

type Mode = 'add' | 'view'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  mode: Mode
  client?: Client | null
}

export function ClientSheet({ open, onOpenChange, mode, client }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  const create = useCreateClient()
  const update = useUpdateClient()

  useEffect(() => {
    if (mode === 'view' && client) {
      setName(client.name)
      setPhone(client.phone)
      setEmail(client.email ?? '')
      setNotes(client.notes ?? '')
    } else if (mode === 'add') {
      setName('')
      setPhone('')
      setEmail('')
      setNotes('')
    }
  }, [mode, client, open])

  const initials = name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const isPending = create.isPending || update.isPending

  async function handleSave() {
    if (!name.trim()) return
    if (!phone.trim()) return

    if (mode === 'add') {
      await create.mutateAsync({ name: name.trim(), phone: phone.trim(), email: email || null, notes: notes || null })
    } else if (client) {
      await update.mutateAsync({ id: client.id, name: name.trim(), phone: phone.trim(), email: email || null, notes: notes || null })
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-safe max-h-[90dvh] overflow-y-auto">
        <SheetHeader className="px-5 pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-11 h-11">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <SheetTitle className="text-base font-semibold text-stone-800">
              {mode === 'add' ? 'Nova cliente' : name || 'Cliente'}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="px-5 space-y-4 pt-2 pb-6">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Nome
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="rounded-xl border-stone-200 focus-visible:ring-primary"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Telefone
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              type="tel"
              className="rounded-xl border-stone-200 focus-visible:ring-primary"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> E-mail
            </Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              type="email"
              className="rounded-xl border-stone-200 focus-visible:ring-primary"
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Observações
            </Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alergias, preferências, etc."
              rows={3}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 bg-transparent outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Info somente leitura */}
          {mode === 'view' && client?.lastVisitAt && (
            <p className="text-xs text-stone-400">
              Última visita: {new Date(client.lastVisitAt).toLocaleDateString('pt-BR')}
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim() || !phone.trim()}
            className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-medium"
          >
            {isPending ? 'Salvando...' : mode === 'add' ? 'Cadastrar' : 'Salvar alterações'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
