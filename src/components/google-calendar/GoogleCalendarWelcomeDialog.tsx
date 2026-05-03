'use client'

import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { sb } from '@/lib/supabase-browser'

const STORAGE_KEY = 'gcal_welcome_shown'

export function GoogleCalendarWelcomeDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY)) return

    sb.from('google_tokens')
      .select('id')
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          localStorage.setItem(STORAGE_KEY, '1')
          setOpen(true)
        }
      })
  }, [])

  function handleConnect() {
    window.location.href = '/api/google-calendar/auth'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-5 h-5 text-rose-400" />
            <DialogTitle>Sincronize sua agenda</DialogTitle>
          </div>
          <DialogDescription>
            Conecte seu Google Calendar para ver seus compromissos pessoais junto com os agendamentos e deixar a Bellu ciente dos seus bloqueios.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-1">
          <Button onClick={handleConnect} className="w-full rounded-xl">
            Conectar Google Calendar
          </Button>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="w-full rounded-xl text-stone-400"
          >
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
