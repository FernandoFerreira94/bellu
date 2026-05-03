"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { Specialty } from "@/types"

type Step = 1 | 2 | 3 | 4

type DaySchedule = {
  active: boolean
  start_time: string
  end_time: string
}

type FormData = {
  studio_name: string
  owner_name: string
  phone: string
  specialty: Specialty | null
  logo_url: string | null
  workingHours: DaySchedule[]
}

const step1Schema = z.object({
  studio_name: z.string().min(2, 'Mínimo 2 caracteres'),
  owner_name: z.string().min(2, 'Mínimo 2 caracteres'),
})

const SPECIALTIES: { value: Specialty; label: string }[] = [
  { value: 'nail_designer', label: 'Nails Designer' },
  { value: 'hair', label: 'Cabelo' },
  { value: 'makeup', label: 'Maquiagem' },
  { value: 'waxing', label: 'Depilação' },
  { value: 'massage', label: 'Massagem' },
  { value: 'other', label: 'Outro' },
]

const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Default: Seg–Sáb ativo 08:00–18:00, Dom inativo
const DEFAULT_HOURS: DaySchedule[] = [
  { active: false, start_time: '08:00', end_time: '18:00' }, // Dom
  { active: true,  start_time: '08:00', end_time: '18:00' }, // Seg
  { active: true,  start_time: '08:00', end_time: '18:00' }, // Ter
  { active: true,  start_time: '08:00', end_time: '18:00' }, // Qua
  { active: true,  start_time: '08:00', end_time: '18:00' }, // Qui
  { active: true,  start_time: '08:00', end_time: '18:00' }, // Sex
  { active: true,  start_time: '08:00', end_time: '18:00' }, // Sáb
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<FormData>({
    studio_name: '',
    owner_name: '',
    phone: '',
    specialty: null,
    logo_url: null,
    workingHours: DEFAULT_HOURS,
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  }

  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  function handleStep1() {
    const parsed = step1Schema.safeParse({
      studio_name: form.studio_name,
      owner_name: form.owner_name,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    setStep(2)
  }

  function handleStep2() {
    if (!form.specialty) {
      toast.error('Selecione sua área de atuação')
      return
    }
    setStep(3)
  }

  function handleStep3() {
    setStep(4)
  }

  function updateDay(idx: number, field: keyof DaySchedule, value: string | boolean) {
    setForm((f) => {
      const hours = [...f.workingHours]
      hours[idx] = { ...hours[idx], [field]: value }
      return { ...f, workingHours: hours }
    })
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo deve ter no máximo 2MB')
      return
    }

    if (!['image/png', 'image/svg+xml'].includes(file.type)) {
      toast.error('Apenas PNG ou SVG')
      return
    }

    setUploading(true)
    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Sessão expirada. Faça login novamente.')
      setUploading(false)
      return
    }

    const ext = file.type === 'image/svg+xml' ? 'svg' : 'png'
    const path = `${user.id}/logo.${ext}`

    const { error } = await supabase.storage
      .from('studio-assets')
      .upload(path, file, { upsert: true })

    if (error) {
      toast.error('Erro ao enviar logo')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('studio-assets')
      .getPublicUrl(path)

    setForm((f) => ({ ...f, logo_url: publicUrl }))
    setLogoPreview(URL.createObjectURL(file))
    setUploading(false)
    toast.success('Logo enviada!')
  }

  async function handleFinish() {
    setLoading(true)

    // 1. Salvar studio_profile
    const res = await fetch('/api/studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studio_name: form.studio_name,
        owner_name: form.owner_name,
        specialty: form.specialty,
        logo_url: form.logo_url,
        phone: form.phone || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Erro ao salvar perfil')
      setLoading(false)
      return
    }

    // 2. Salvar working_hours
    const supabase = createSupabaseBrowserClient()
    const rows = form.workingHours.map((wh, idx) => ({
      day_of_week: idx,
      start_time: wh.start_time + ':00',
      end_time: wh.end_time + ':00',
      active: wh.active,
    }))

    const { error: whError } = await supabase
      .from('working_hours')
      .upsert(rows, { onConflict: 'day_of_week' })

    if (whError) {
      console.error('[onboarding] working_hours error:', whError)
      // não bloqueia — usuário pode ajustar depois em settings
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Progress header */}
      <div className="flex items-center gap-4 mb-8">
        {step > 1 && (
          <button onClick={handleBack} className="text-muted-foreground shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex gap-1.5 flex-1">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1 — Sobre você */}
      {step === 1 && (
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h1 className="text-2xl font-medium text-tercery mb-1">Sobre você</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Vamos personalizar seu espaço. Você pode editar tudo depois.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studio_name" className="uppercase text-xs tracking-wider">
                Nome do Studio
              </Label>
              <Input
                id="studio_name"
                placeholder="Ex: Studio Ayumi"
                value={form.studio_name}
                onChange={(e) => setForm((f) => ({ ...f, studio_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name" className="uppercase text-xs tracking-wider">
                Seu nome
              </Label>
              <Input
                id="owner_name"
                placeholder="Ex: Ayumi"
                value={form.owner_name}
                onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="uppercase text-xs tracking-wider">
                WhatsApp <span className="normal-case text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
                inputMode="numeric"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Área de atuação */}
      {step === 2 && (
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h1 className="text-2xl font-medium text-tercery mb-1">Área de atuação</h1>
          <p className="text-muted-foreground text-sm mb-6">
            O que você faz? Selecione uma opção.
          </p>
          <div className="flex gap-2 flex-wrap">
            {SPECIALTIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, specialty: value }))}
              >
                <Badge
                  variant={form.specialty === value ? 'default' : 'outline'}
                  className="cursor-pointer text-sm py-1.5 px-3 transition-colors"
                >
                  {label}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Horários de expediente */}
      {step === 3 && (
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h1 className="text-2xl font-medium text-tercery mb-1">Seu expediente</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Quando você trabalha? Já configuramos o padrão — ajuste se precisar.
          </p>
          <div className="space-y-2">
            {form.workingHours.map((wh, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  wh.active ? 'bg-white border-stone-200' : 'bg-stone-50 border-stone-100'
                }`}
              >
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => updateDay(idx, 'active', !wh.active)}
                  className={`w-10 h-5 rounded-full transition-colors shrink-0 relative ${
                    wh.active ? 'bg-primary' : 'bg-stone-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      wh.active ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                {/* Dia */}
                <span className={`text-sm font-medium w-8 shrink-0 ${wh.active ? 'text-stone-700' : 'text-stone-400'}`}>
                  {DOW_LABELS[idx]}
                </span>

                {/* Horários */}
                {wh.active ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="time"
                      value={wh.start_time}
                      onChange={(e) => updateDay(idx, 'start_time', e.target.value)}
                      className="flex-1 text-sm border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-primary text-stone-700 bg-white"
                    />
                    <span className="text-stone-400 text-xs">até</span>
                    <input
                      type="time"
                      value={wh.end_time}
                      onChange={(e) => updateDay(idx, 'end_time', e.target.value)}
                      className="flex-1 text-sm border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-primary text-stone-700 bg-white"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-stone-400 flex-1">Folga</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4 — Sua marca */}
      {step === 4 && (
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h1 className="text-2xl font-medium text-tercery mb-1">Sua marca</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Adicione sua logo. PNG ou SVG com fundo transparente. Opcional.
          </p>
          <div className="flex flex-col items-center gap-6">
            {logoPreview ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoPreview}
                  alt="Preview da logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                <span className="text-muted-foreground text-xs text-center px-2">Sua logo</span>
              </div>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/png,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <span className="text-sm text-primary underline underline-offset-2">
                {uploading ? 'Enviando...' : logoPreview ? 'Trocar logo' : 'Escolher logo'}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="pb-4 space-y-3">
        {step === 1 && (
          <Button size="lg" className="w-full rounded-full" onClick={handleStep1}>
            Continuar
          </Button>
        )}
        {step === 2 && (
          <Button size="lg" className="w-full rounded-full" onClick={handleStep2}>
            Continuar
          </Button>
        )}
        {step === 3 && (
          <Button size="lg" className="w-full rounded-full" onClick={handleStep3}>
            Continuar
          </Button>
        )}
        {step === 4 && (
          <>
            <Button
              size="lg"
              className="w-full rounded-full"
              onClick={handleFinish}
              disabled={loading || uploading}
            >
              {loading ? 'Salvando...' : 'Entrar no dashboard'}
            </Button>
            {!form.logo_url && (
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="w-full text-center text-sm text-muted-foreground disabled:opacity-50"
              >
                Pular por agora
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
