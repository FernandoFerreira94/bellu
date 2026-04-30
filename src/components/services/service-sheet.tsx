'use client'

import { useState, useEffect } from 'react'
import { Scissors, Clock, DollarSign, FileText, Trash2, Sparkles } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useCreateService, useUpdateService, useDeleteService } from '@/hooks/useServices'
import type { Service } from '@/types'

type Mode = 'add' | 'edit'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  mode: Mode
  service?: Service | null
}

export function ServiceSheet({ open, onOpenChange, mode, service }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priceCents, setPriceCents] = useState(0)
  const [duration, setDuration] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [lunaEnabled, setLunaEnabled] = useState(true)

  const create = useCreateService()
  const update = useUpdateService()
  const remove = useDeleteService()

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return }
    if (mode === 'edit' && service) {
      setName(service.name)
      setDescription(service.description ?? '')
      setPriceCents(Math.round(service.price * 100))
      setDuration(service.durationInMinutes.toString())
      setLunaEnabled(service.lunaEnabled ?? true)
    } else {
      setName('')
      setDescription('')
      setPriceCents(0)
      setDuration('')
      setLunaEnabled(true)
    }
  }, [open, mode, service])

  const isPending = create.isPending || update.isPending || remove.isPending
  const isValid = name.trim() && priceCents > 0 && duration && Number(duration) > 0
  const priceDisplay = priceCents > 0
    ? (priceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : ''

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    setPriceCents(digits ? parseInt(digits) : 0)
  }

  async function handleSave() {
    if (!isValid) return
    const input = {
      name: name.trim(),
      description: description.trim() || null,
      price: priceCents / 100,
      durationInMinutes: parseInt(duration),
      lunaEnabled,
    }
    if (mode === 'add') {
      await create.mutateAsync(input)
    } else if (service) {
      await update.mutateAsync({ id: service.id, ...input })
    }
    onOpenChange(false)
  }

  async function handleDelete() {
    if (!service) return
    await remove.mutateAsync(service.id)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-safe max-h-[92dvh] overflow-y-auto">
        <SheetHeader className="px-5 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
              <Scissors className="w-4 h-4 text-rose-400" />
            </div>
            <SheetTitle className="text-base font-semibold text-stone-800">
              {mode === 'add' ? 'Novo serviço' : 'Editar serviço'}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="px-5 pt-4 pb-6 space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-400 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" /> Nome do serviço
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Manicure simples"
              className="rounded-xl border-stone-200 focus-visible:ring-primary"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Descrição
            </Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o serviço (opcional)"
              rows={2}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 bg-transparent outline-none focus:ring-2 focus:ring-rose-200 resize-none"
            />
          </div>

          {/* Preço + Duração lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-stone-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Valor (R$)
              </Label>
              <Input
                value={priceDisplay}
                onChange={handlePriceChange}
                placeholder="0,00"
                inputMode="numeric"
                className="rounded-xl border-stone-200 focus-visible:ring-rose-300"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-stone-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Duração (min)
              </Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                type="number"
                min="1"
                className="rounded-xl border-stone-200 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Luna */}
          <div className="flex items-center justify-between px-1 py-1">
            <Label className="text-xs text-stone-500 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-300" />
              Luna pode oferecer este serviço
            </Label>
            <Switch
              checked={lunaEnabled}
              onCheckedChange={setLunaEnabled}
            />
          </div>

          {/* Salvar */}
          <Button
            onClick={handleSave}
            disabled={isPending || !isValid}
            className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-medium disabled:opacity-40"
          >
            {isPending ? 'Salvando...' : mode === 'add' ? 'Criar serviço' : 'Salvar alterações'}
          </Button>

          {/* Excluir — só no modo edição */}
          {mode === 'edit' && (
            confirmDelete ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-stone-200 text-stone-500"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {isPending ? 'Excluindo...' : 'Confirmar exclusão'}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center justify-center gap-2 w-full py-2 text-xs text-stone-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir serviço
              </button>
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
