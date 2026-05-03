'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { sb } from '@/lib/supabase-browser'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import { GoogleCalendarConnect } from '@/components/settings/GoogleCalendarConnect'

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type WorkingHourRow = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

type DraftRow = {
  id: string | null
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

function buildDefaults(): DraftRow[] {
  return DAY_NAMES.map((_, i) => ({
    id: null,
    day_of_week: i,
    start_time: '08:00',
    end_time: '19:00',
    active: i >= 1 && i <= 5,
  }))
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const [draft, setDraft] = useState<DraftRow[] | null>(null)

  const { data: savedHours, isLoading } = useQuery<WorkingHourRow[]>({
    queryKey: ['working_hours'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('working_hours')
        .select('id, day_of_week, start_time, end_time, active')
        .order('day_of_week')
      if (error) throw error
      return (data ?? []) as WorkingHourRow[]
    },
  })

  useEffect(() => {
    if (!savedHours || draft) return
    const defaults = buildDefaults()
    const merged = defaults.map((d) => {
      const found = savedHours.find((r) => r.day_of_week === d.day_of_week)
      if (!found) return d
      return {
        id: found.id,
        day_of_week: found.day_of_week,
        start_time: found.start_time.slice(0, 5),
        end_time: found.end_time.slice(0, 5),
        active: found.active,
      }
    })
    setDraft(merged)
  }, [savedHours]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async (rows: DraftRow[]) => {
      for (const row of rows) {
        const payload = {
          day_of_week: row.day_of_week,
          start_time: row.start_time,
          end_time: row.end_time,
          active: row.active,
        }
        if (row.id) {
          const { error } = await sb
            .from('working_hours')
            .update(payload)
            .eq('id', row.id)
          if (error) throw error
        } else {
          const { error } = await sb
            .from('working_hours')
            .insert(payload)
          if (error) throw error
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['working_hours'] })
      toast.success('Horários salvos!')
    },
    onError: () => toast.error('Erro ao salvar horários'),
  })

  function update(index: number, field: keyof DraftRow, value: string | boolean) {
    setDraft((prev) =>
      prev ? prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)) : prev,
    )
  }

  if (isLoading || !draft) {
    return (
      <div className="px-4 py-6 space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-stone-100 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="px-2 py-6 max-w-lg mx-auto">
      <p className="text-xs font-medium uppercase tracking-widest text-stone-400">Horários</p>
      <div className="flex items-center gap-2 mb-6 mt-2">
        <Clock className="w-4 h-4 text-rose-400" />
        <h1 className="mt-1 text-2xl font-semibold text-stone-800">Horários de expediente</h1>
      </div>

      <div className="space-y-3">
        {draft.map((row, i) => (
          <div
            key={row.day_of_week}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors ${
              row.active ? 'border-stone-200 bg-white' : 'border-stone-100 bg-stone-50'
            }`}
          >
            <Switch
              checked={row.active}
              onCheckedChange={(v) => update(i, 'active', v)}
            />
            <Label className={`w-12 text-sm font-medium ${row.active ? 'text-stone-700' : 'text-stone-400'}`}>
              {DAY_NAMES[row.day_of_week]}
            </Label>
            {row.active ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={row.start_time}
                  onChange={(e) => update(i, 'start_time', e.target.value)}
                  className="flex-1 text-sm rounded-xl border border-stone-200 px-2 py-1.5 text-stone-700 outline-none focus:border-rose-300"
                />
                <span className="text-xs text-stone-400">-</span>
                <input
                  type="time"
                  value={row.end_time}
                  onChange={(e) => update(i, 'end_time', e.target.value)}
                  className="flex-1 text-sm rounded-xl border border-stone-200 px-2 py-1.5 text-stone-700 outline-none focus:border-rose-300"
                />
              </div>
            ) : (
              <span className="text-xs text-stone-400 flex-1">Folga</span>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={() => save.mutate(draft)}
        disabled={save.isPending}
        className="w-full mt-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium disabled:opacity-40"
      >
        {save.isPending ? 'Salvando...' : 'Salvar horários'}
      </Button>

      <div className="mt-6 border border-stone-200 rounded-2xl p-4 bg-white">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-3">
          Integrações
        </p>
        <GoogleCalendarConnect />
      </div>

    </div>
  )
}
