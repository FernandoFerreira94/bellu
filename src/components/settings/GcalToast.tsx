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

      let done = false

      // Polling: verifica quando importação terminar
      const interval = setInterval(async () => {
        try {
          const res = await fetch('/api/google-calendar/import-status')
          if (!res.ok) return
          const json = await res.json()
          if (json.done) {
            done = true
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
      const timeout = setTimeout(() => {
        if (!done) {
          clearInterval(interval)
          setSync(false)
        }
      }, 120_000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
        setSync(false)
      }

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
