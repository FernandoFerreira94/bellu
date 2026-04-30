'use client'

import { useState, useEffect } from 'react'
import { DollarSign, FileText, Tag, Calendar } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { sb } from '@/lib/supabase-browser'

const CATEGORIES = [
  'Material',
  'Conta de luz',
  'Aluguel',
  'Internet',
  'Transporte',
  'Equipamento',
  'Marketing',
  'Outro',
]

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess?: () => void
}

export function ExpenseSheet({ open, onOpenChange, onSuccess }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [amountCents, setAmountCents] = useState(0)
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setDescription('')
    setCategory('')
    setCustomCategory('')
    setAmountCents(0)
    setDate(today)
  }, [open])

  const amountDisplay = amountCents > 0
    ? (amountCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    : ''

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    setAmountCents(digits ? parseInt(digits) : 0)
  }

  const finalCategory = category === 'Outro' ? customCategory.trim() : category
  const isValid = description.trim() && amountCents > 0 && finalCategory && date

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    const { error } = await sb.from('transactions').insert({
      type: 'expense',
      amount: amountCents / 100,
      description: `${finalCategory}: ${description.trim()}`,
      date,
    })
    setSaving(false)
    if (error) { toast.error('Erro ao salvar despesa'); return }
    toast.success('Despesa registrada!')
    onSuccess?.()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-safe max-h-[92dvh] overflow-y-auto">
        <SheetHeader className="px-5 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-rose-400" />
            </div>
            <SheetTitle className="text-base font-semibold text-stone-800">Nova despesa</SheetTitle>
          </div>
        </SheetHeader>

        <div className="px-5 pt-4 pb-6 space-y-4">

          {/* Categoria */}
          <div className="space-y-2">
            <Label className="text-xs text-stone-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Categoria
            </Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    category === c
                      ? 'bg-rose-400 text-white border-rose-400'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-rose-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            {category === 'Outro' && (
              <Input
                autoFocus
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Qual categoria?"
                className="rounded-xl border-stone-200 focus-visible:ring-rose-300 mt-1"
              />
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Descrição
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Esmaltes, cabos de bits..."
              className="rounded-xl border-stone-200 focus-visible:ring-rose-300"
            />
          </div>

          {/* Valor + Data lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-stone-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Valor (R$)
              </Label>
              <Input
                value={amountDisplay}
                onChange={handleAmountChange}
                placeholder="0,00"
                inputMode="numeric"
                className="rounded-xl border-stone-200 focus-visible:ring-rose-300"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-stone-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Data
              </Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 bg-white outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !isValid}
            className="w-full rounded-xl bg-rose-400 hover:bg-rose-500 text-white font-medium disabled:opacity-40"
          >
            {saving ? 'Salvando...' : 'Registrar despesa'}
          </Button>

        </div>
      </SheetContent>
    </Sheet>
  )
}
