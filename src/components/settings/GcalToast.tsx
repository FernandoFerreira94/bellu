'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function GcalToast() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const gcal = params.get('gcal')
    if (!gcal) return

    if (gcal === 'connected') {
      toast.success('Google Calendar conectado! Bellu está analisando sua agenda...')
    } else if (gcal === 'error') {
      toast.error('Erro ao conectar Google Calendar. Tente novamente.')
    }

    // Limpar query param sem reload
    const url = new URL(window.location.href)
    url.searchParams.delete('gcal')
    router.replace(url.pathname)
  }, [params, router])

  return null
}
