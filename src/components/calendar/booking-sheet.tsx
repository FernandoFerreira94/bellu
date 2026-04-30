'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Scissors, FileText, AlertTriangle, CalendarIcon, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
  AlertDialogMedia,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useClients } from '@/hooks/useClients'
import { useServices } from '@/hooks/useServices'
import { useBookings, useCreateBooking } from '@/hooks/useBookings'
import { formatSlotTime, type TimeSlot } from '@/lib/availability'
import { sb } from '@/lib/supabase-browser'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Calendar as DatePicker } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
const GAP_WARN_MS = 30 * 60 * 1000 // 30 minutos
const DEFAULT_WORKING_HOURS = [
  { day_of_week: 0, start_time: '08:00', end_time: '19:00', active: false },
  { day_of_week: 1, start_time: '08:00', end_time: '19:00', active: true },
  { day_of_week: 2, start_time: '08:00', end_time: '19:00', active: true },
  { day_of_week: 3, start_time: '08:00', end_time: '19:00', active: true },
  { day_of_week: 4, start_time: '08:00', end_time: '19:00', active: true },
  { day_of_week: 5, start_time: '08:00', end_time: '19:00', active: true },
  { day_of_week: 6, start_time: '08:00', end_time: '16:00', active: true },
]
const SLOT_INTERVAL_MINUTES = 30

type WorkingHour = {
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

type ExistingBooking = {
  startTime: string
  endTime: string
}

function parseTime(date: Date, timeStr: string) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const parsed = new Date(date)
  parsed.setHours(hours, minutes, 0, 0)
  return parsed
}

function getSelectableSlots(
  date: Date,
  durationMinutes: number,
  workingHours: WorkingHour[],
  existingBookings: ExistingBooking[],
) {
  const workingHour = workingHours.find((w) => w.day_of_week === date.getDay() && w.active)
  if (!workingHour) return []

  const dayStart = parseTime(date, workingHour.start_time)
  const dayEnd = parseTime(date, workingHour.end_time)
  const slots: TimeSlot[] = []
  let cursor = new Date(dayStart)

  while (cursor < dayEnd) {
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60 * 1000)
    if (slotEnd > dayEnd) break

    const hasConflict = existingBookings.some((booking) => {
      const bookingStart = new Date(booking.startTime)
      const bookingEnd = new Date(booking.endTime)
      return cursor < bookingEnd && slotEnd > bookingStart
    })

    if (!hasConflict) {
      slots.push({ start: new Date(cursor), end: slotEnd })
    }

    cursor = new Date(cursor.getTime() + SLOT_INTERVAL_MINUTES * 60 * 1000)
  }

  return slots
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialDate?: Date
  initialTime?: string | null
  initialClientId?: string | null
  initialProcedureId?: string | null
  ignoreBookingId?: string | null
}

export function BookingSheet({
  open,
  onOpenChange,
  initialDate,
  initialTime,
  initialClientId,
  initialProcedureId,
  ignoreBookingId,
}: Props) {
  const today = new Date()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [clientId, setClientId]       = useState('')
  const [procedureId, setProcedureId] = useState('')
  const [date, setDate]               = useState(initialDate ?? today)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [manualTime, setManualTime]   = useState('')
  const [notes, setNotes]             = useState('')
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([])
  const [gapWarning, setGapWarning]   = useState(false)

  const { data: clients }   = useClients()
  const { data: services }  = useServices()
  const createBooking       = useCreateBooking()

  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999)
  const { data: dayBookings } = useBookings(dayStart, dayEnd)

  useEffect(() => {
    sb.from('working_hours').select('day_of_week, start_time, end_time, active').then(({ data }) => {
      if (data) setWorkingHours(data as typeof workingHours)
    })
  }, [])

  useEffect(() => {
    if (!open) return
    setClientId(''); setProcedureId(''); setDate(initialDate ?? today)
    setClientId(initialClientId ?? '')
    setProcedureId(initialProcedureId ?? '')
    setSelectedSlot(null); setManualTime(initialTime ?? ''); setNotes(''); setGapWarning(false); setCalendarOpen(false)
  }, [open])

  const selectedClient = clients?.find((c) => c.id === clientId)
  const selectedService = services?.find((s) => s.id === procedureId)
  const availabilityHours = workingHours.length ? workingHours : DEFAULT_WORKING_HOURS
  const effectiveDayBookings = (dayBookings ?? []).filter((booking) => booking.id !== ignoreBookingId)
  const slots = selectedService
    ? getSelectableSlots(date, selectedService.durationInMinutes, availabilityHours, effectiveDayBookings)
    : []
  const displaySlots = selectedService
    ? slots
    : getSelectableSlots(date, SLOT_INTERVAL_MINUTES, availabilityHours, effectiveDayBookings)

  const isValid = clientId && procedureId && selectedSlot

  /** Verifica se o slot escolhido tem menos de 30 min de folga com qualquer booking existente */
  function hasSmallGap(slot: TimeSlot): boolean {
    return effectiveDayBookings.some(b => {
      const bStart = new Date(b.startTime).getTime()
      const bEnd   = new Date(b.endTime).getTime()
      const gapBefore = slot.start.getTime() - bEnd        // folga entre fim do existente e início do novo
      const gapAfter  = bStart - slot.end.getTime()        // folga entre fim do novo e início do existente
      return (gapBefore >= 0 && gapBefore < GAP_WARN_MS) ||
             (gapAfter  >= 0 && gapAfter  < GAP_WARN_MS)
    })
  }

  async function doSave() {
    if (!isValid || !selectedSlot) return
    await createBooking.mutateAsync({
      clientId,
      procedureId,
      startTime: selectedSlot.start,
      endTime:   selectedSlot.end,
      notes:     notes.trim() || null,
    })
    setGapWarning(false)
    onOpenChange(false)
  }

  function handleSave() {
    if (!isValid || !selectedSlot) return
    if (hasSmallGap(selectedSlot)) {
      setGapWarning(true)
    } else {
      doSave()
    }
  }

  const dateStr  = date.toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (!hours) return `${remainingMinutes} min`
    if (!remainingMinutes) return `${hours}h`
    return `${hours}h ${remainingMinutes}min`
  }

  function handleManualTimeChange(value: string) {
    setManualTime(value)

    if (!value || !selectedService) {
      setSelectedSlot(null)
      return
    }

    const matchingSlot = slots.find((slot) => format(slot.start, 'HH:mm') === value)
    if (!matchingSlot || isPastSlot(matchingSlot)) {
      setSelectedSlot(null)
      return
    }

    setSelectedSlot(matchingSlot)
  }

  function isPastSlot(slot: TimeSlot) {
    return slot.start.getTime() < new Date().getTime()
  }

  useEffect(() => {
    if (!manualTime || !selectedService) return
    handleManualTimeChange(manualTime)
  }, [procedureId])

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-safe max-h-[92dvh] overflow-y-auto">
          <SheetHeader className="px-5 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-rose-400" />
              </div>
              <SheetTitle className="text-base font-semibold text-stone-800">Novo agendamento</SheetTitle>
            </div>
          </SheetHeader>

          <div className="px-5 pt-4 pb-6 space-y-4">

            {/* Cliente */}
            <div className="space-y-1.5">
              <Label className="text-xs text-stone-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Cliente
              </Label>
              <Combobox
                items={clients?.map((c) => c.name)}
                value={selectedClient?.name ?? null}
                onValueChange={(name) => {
                  const client = clients?.find((c) => c.name === name)
                  setClientId(client?.id ?? '')
                }}
              >
      <ComboboxInput placeholder="Selecionar cliente" className=" h-10 rounded-xl border border-stone-200 " />
      <ComboboxContent >
        <ComboboxEmpty>Nenhum cliente encontrado</ComboboxEmpty>
        <ComboboxList className="max-h-[25vh] overflow-y-scroll">
          {(item) => (
            <ComboboxItem key={item} value={item} className=" pt-3">
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
             
            </div>

            {/* Serviço */}
            <div className="space-y-1.5">
              <Label className="text-xs text-stone-400 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" /> Serviço
              </Label>
               <Combobox
                items={services?.map((s) => s.name)}
                value={selectedService?.name ?? null}
                onValueChange={(name) => {
                  const service = services?.find((s) => s.name === name)
                  setProcedureId(service?.id ?? '')
                  
                }}
              >
      <ComboboxInput placeholder="Selecionar serviço" className=" h-10 rounded-xl border border-stone-200 " />
      <ComboboxContent >
        <ComboboxEmpty>Nenhum serviço encontrado</ComboboxEmpty>
        <ComboboxList className="max-h-[25vh] overflow-y-scroll gap-1 flex flex-col ">
          {(item) => (
            <ComboboxItem key={item} value={item} className=" py-2">
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
    {selectedService && (
      <div className="mt-2 flex items-center gap-1.5 px-1 animate-in fade-in slide-in-from-top-1">
        <Clock className="w-3 h-3 text-stone-400" />
        <span className="text-xs font-medium text-stone-500  tracking-tight">
          Duração: {formatDuration(selectedService.durationInMinutes)}
        </span>
      </div>
    )}
  </div>

              <div className="space-y-1.5">
              <Label className="text-xs text-stone-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Data
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild className='cursor-pointer w-full'>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-12 rounded-2xl border border-stone-200 bg-stone-50/50 px-4 justify-between font-medium text-stone-700 hover:bg-stone-50 hover:border-primary/30 transition-all",
                      !date && "text-stone-400"
                    )}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <CalendarIcon className="w-4 h-4 text-primary opacity-70" />
                      {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : <span>Escolha uma data</span>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="center" className="p-0  w-full">
                  <div className="bg-white rounded-3xl p-4 shadow-2xl border border-stone-100 ring-1 ring-stone-200/10">
                    <DatePicker
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        if (!d) return
                        setDate(d)
                        setSelectedSlot(null)
                        setManualTime('')
                        setCalendarOpen(false)
                      }}
                      disabled={(date) => date < today && format(date, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd')}
                      initialFocus
                      locale={ptBR}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs text-stone-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Horario desejado
                </Label>
                {selectedService && (
                  <span className="text-xs font-medium text-stone-500">
                    {formatDuration(selectedService.durationInMinutes)}
                  </span>
                )}
              </div>

              {displaySlots.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 px-4 py-3 text-xs text-stone-400">
                  Nenhum horario disponivel para este dia.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {displaySlots.map((slot) => {
                    const slotTime = format(slot.start, 'HH:mm')
                    const active = manualTime === slotTime
                    const smallGap = selectedService ? hasSmallGap(slot) : false
                    const disabled = isPastSlot(slot)

                    return (
                      <button
                        key={slotTime}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (disabled) return
                          setManualTime(slotTime)
                          setSelectedSlot(selectedService ? slot : null)
                        }}
                        className={cn(
                          "h-12 rounded-2xl border text-sm font-semibold transition-all disabled:cursor-not-allowed",
                          disabled
                            ? "border-stone-100 bg-stone-50 text-stone-300 line-through"
                            : active
                            ? "border-rose-400 bg-rose-400 text-white shadow-sm"
                            : smallGap
                              ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300"
                              : "border-stone-200 bg-white text-stone-700 hover:border-rose-200 hover:text-rose-500"
                        )}
                      >
                        {formatSlotTime(slot.start)}
                      </button>
                    )
                  })}
                </div>
              )}

              {!selectedService && manualTime && (
                <p className="text-xs text-stone-400">
                  Selecione um servico para confirmar a duracao.
                </p>
              )}

              {selectedService && selectedSlot && (
                <p className="text-xs text-stone-400">
                  Termina as {formatSlotTime(selectedSlot.end)}
                </p>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label className="text-xs text-stone-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Observações
              </Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional"
                rows={2}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 bg-transparent outline-none focus:ring-2 focus:ring-rose-200 resize-none"
              />
            </div>

           

            <Button
              onClick={handleSave}
              disabled={!isValid || createBooking.isPending}
              className="w-full rounded-xl bg-rose-400 hover:bg-rose-500 text-white font-medium disabled:opacity-40"
            >
              {createBooking.isPending ? 'Agendando...' : 'Agendar'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Alerta de intervalo curto */}
      <AlertDialog open={gapWarning} onOpenChange={setGapWarning}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="text-amber-500" />
            </AlertDialogMedia>
            <AlertDialogTitle>Intervalo menor que 30 min</AlertDialogTitle>
            <AlertDialogDescription>
              Esse horário deixa menos de 30 minutos de folga entre um agendamento e outro.
              Deseja agendar mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGapWarning(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={doSave}
              disabled={createBooking.isPending}
              className="bg-rose-400 hover:bg-rose-500 text-white"
            >
              {createBooking.isPending ? 'Agendando...' : 'Agendar mesmo assim'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
