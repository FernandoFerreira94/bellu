'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSyncStore } from '@/store/syncStore'

export function GcalToast() {
  const params = useSearchParams()
  const router = useRouter()
  const setSync = useSyncStore((s) => s.setSync)

  useEffect(() => {
    const gcal = params.get('gcal')
    if (!gcal) return

    if (gcal === 'connected') {
      toast.success('Google Calendar conectado!')
      setSync(true)

      // Polling: verifica quando importação terminar
      const interval = setInterval(async () => {
        try {
          const res = await fetch('/api/google-calendar/import-status')
          if (!res.ok) return
          const { done } = await res.json()
          if (done) {
            setSync(false)
            clearInterval(interval)
            toast.success('Bellu analisou sua agenda! Veja o chat.')
            router.refresh()
          }
        } catch {
          // ignorar erros de rede silenciosamente
        }
      }, 3000)

      // Timeout máximo de 2 minutos
      setTimeout(() => {
        clearInterval(interval)
        setSync(false)
      }, 120_000)

    } else if (gcal === 'error') {
      toast.error('Erro ao conectar Google Calendar. Tente novamente.')
    }

    // Limpar query param
    const url = new URL(window.location.href)
    url.searchParams.delete('gcal')
    router.replace(url.pathname)
  }, [params, router, setSync])

  return null
}
