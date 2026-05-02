'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CalendarDays, Loader2, Unlink } from 'lucide-react'
import { sb } from '@/lib/supabase-browser'

export function GoogleCalendarConnect() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    sb.from('google_tokens')
      .select('id')
      .maybeSingle()
      .then(({ data }) => setConnected(!!data))
  }, [])

  async function handleDisconnect() {
    setLoading(true)
    try {
      const res = await fetch('/api/google-calendar/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error()
      setConnected(false)
      toast.success('Google Calendar desconectado')
      router.refresh()
    } catch {
      toast.error('Erro ao desconectar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-5 w-5 text-stone-500" />
        <div>
          <p className="text-sm font-medium text-stone-700">Google Calendar</p>
          <p className="text-xs text-stone-500">
            {connected
              ? 'Agenda sincronizada com Bellu'
              : 'Conecte para sincronizar sua agenda'}
          </p>
        </div>
        {connected && (
          <Badge
            variant="outline"
            className="text-emerald-600 border-emerald-200 text-xs"
          >
            Conectado
          </Badge>
        )}
      </div>

      {connected === null ? (
        <div className="h-8 w-20 rounded-lg bg-stone-100 animate-pulse" />
      ) : connected ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          disabled={loading}
          className="text-stone-400 hover:text-rose-600"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Unlink className="h-4 w-4" />
          )}
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => { window.location.href = '/api/google-calendar/auth' }}
          className="bg-rose-500 hover:bg-rose-600 text-white"
        >
          Conectar
        </Button>
      )}
    </div>
  )
}
