'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { sb } from '@/lib/supabase-browser'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Bot } from 'lucide-react'

type LunaConfig = {
  luna_whatsapp_number: string
  luna_confirmation_enabled: boolean
  luna_client_enabled: boolean
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

export default function LunaSettingsPage() {
  const [luna, setLuna] = useState<LunaConfig>({
    luna_whatsapp_number: '',
    luna_confirmation_enabled: false,
    luna_client_enabled: false,
  })
  const [lunaLoaded, setLunaLoaded] = useState(false)
  const [savingLuna, setSavingLuna] = useState(false)
  const lunaNumberRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    sb
      .from('studio_profile')
      .select('luna_whatsapp_number, luna_confirmation_enabled, luna_client_enabled')
      .single()
      .then(({ data }) => {
        if (data) {
          setLuna({
            luna_whatsapp_number: data.luna_whatsapp_number ?? '',
            luna_confirmation_enabled: data.luna_confirmation_enabled ?? false,
            luna_client_enabled: data.luna_client_enabled ?? false,
          })
        }
        setLunaLoaded(true)
      })
  }, [])

  async function saveLuna(patch: Partial<LunaConfig>) {
    const next = { ...luna, ...patch }
    const anyEnabled = next.luna_confirmation_enabled || next.luna_client_enabled
    if (anyEnabled && !next.luna_whatsapp_number.trim()) {
      toast.error('Informe o número do bot Luna antes de ativar')
      lunaNumberRef.current?.focus()
      return
    }
    setSavingLuna(true)
    setLuna(next)
    const { error } = await sb
      .from('studio_profile')
      .update({
        luna_whatsapp_number: next.luna_whatsapp_number.trim() || null,
        luna_confirmation_enabled: next.luna_confirmation_enabled,
        luna_client_enabled: next.luna_client_enabled,
      })
    setSavingLuna(false)
    if (error) {
      toast.error('Erro ao salvar configurações da Luna')
      setLuna(luna)
    } else {
      toast.success('Configurações da Luna salvas!')
    }
  }

  return (
    <div className="px-2 py-6 max-w-lg mx-auto">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-400">Inteligência Artificial</p>
      <div className="flex items-center gap-2 mb-6 mt-2">
        <Bot className=" text-rose-400" />
        <h1 className="mt-1 text-2xl font-semibold text-stone-800">Configurações da Luna</h1>
      </div>

      <div className="space-y-3">
        {/* Número do bot */}
        <div className="px-4 py-3 rounded-2xl border border-stone-200 bg-white space-y-2">
          <label className="text-xs text-stone-400 font-medium uppercase tracking-widest">
            Número do bot Luna
          </label>
          <Input
            ref={lunaNumberRef}
            type="tel"
            inputMode="numeric"
            placeholder="(11) 99999-9999"
            value={luna.luna_whatsapp_number}
            onChange={(e) =>
              setLuna((prev) => ({ ...prev, luna_whatsapp_number: formatPhone(e.target.value) }))
            }
            onBlur={() => saveLuna({})}
            className="border-stone-200 focus-visible:ring-stone-300 text-sm"
            disabled={!lunaLoaded}
          />
        </div>

        {/* Confirmação 24h */}
        <div
          className={`flex items-center gap-4 px-4 py-3 rounded-2xl border transition-colors ${
            luna.luna_confirmation_enabled
              ? 'border-stone-200 bg-white'
              : 'border-stone-100 bg-stone-50'
          }`}
        >
          <Switch
            checked={luna.luna_confirmation_enabled}
            onCheckedChange={(v) => saveLuna({ luna_confirmation_enabled: v })}
            disabled={savingLuna || !lunaLoaded}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-700">Confirmação 24h</p>
            <p className="text-xs text-stone-400">Luna envia lembrete 24h antes do agendamento</p>
          </div>
        </div>

        {/* Modo Cliente Autônomo */}
        <div
          className={`flex items-center gap-4 px-4 py-3 rounded-2xl border transition-colors ${
            luna.luna_client_enabled
              ? 'border-stone-200 bg-white'
              : 'border-stone-100 bg-stone-50'
          }`}
        >
          <Switch
            checked={luna.luna_client_enabled}
            onCheckedChange={(v) => saveLuna({ luna_client_enabled: v })}
            disabled={savingLuna || !lunaLoaded}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-700">Modo Cliente Autônomo</p>
            <p className="text-xs text-stone-400">Clientes podem agendar diretamente via WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  )
}
