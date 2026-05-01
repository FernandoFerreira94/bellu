'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { type Booking, useCancelBooking, useBookings } from '@/hooks/useBookings'
import { BookingSheet } from './booking-sheet'

const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTHS_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DOW_LABELS   = ['D','S','T','Q','Q','S','S']
const DOW_FULL     = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

type View = 'year' | 'month' | 'day'

const HOUR_HEIGHT = 64   // px por hora
const DAY_START   = 5
const DAY_END     = 23

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function WeekView() {
  const today = new Date()
  const [view, setView]     = useState<View>('month')
  const [year, setYear]     = useState(today.getFullYear())
  const [month, setMonth]   = useState(today.getMonth())
  const [day, setDay]       = useState(today.getDate())
  const [sheetOpen, setSheetOpen]   = useState(false)
  const [sheetDate, setSheetDate]   = useState<Date>(today)
  const [sheetInitialTime, setSheetInitialTime] = useState<string | null>(null)
  const [sheetInitialClientId, setSheetInitialClientId] = useState<string | null>(null)
  const [sheetInitialProcedureId, setSheetInitialProcedureId] = useState<string | null>(null)
  const [sheetIgnoreBookingId, setSheetIgnoreBookingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [bookingAction, setBookingAction] = useState<Booking | null>(null)

  const stripRef        = useRef<HTMLDivElement>(null)
  const selectedDayRef  = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (view !== 'day') return
    const strip = stripRef.current
    const el    = selectedDayRef.current
    if (!strip || !el) return
    strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [view, year, month, day])

  const cancel = useCancelBooking()

  const { from, to } = useMemo(() => {
    if (view === 'day')
      return { from: new Date(year, month, day, 0, 0, 0), to: new Date(year, month, day, 23, 59, 59) }
    if (view === 'month')
      return { from: new Date(year, month, 1), to: new Date(year, month + 1, 0, 23, 59, 59) }
    return { from: new Date(year, 0, 1), to: new Date(year, 11, 31, 23, 59, 59) }
  }, [view, year, month, day])

  const { data: bookings, isLoading } = useBookings(from, to)

  function prev() {
    if (view === 'day') {
      const d = new Date(year, month, day - 1)
      setYear(d.getFullYear()); setMonth(d.getMonth()); setDay(d.getDate())
    } else if (view === 'month') {
      if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
    } else {
      setYear(y => y - 1)
    }
  }

  function next() {
    if (view === 'day') {
      const d = new Date(year, month, day + 1)
      setYear(d.getFullYear()); setMonth(d.getMonth()); setDay(d.getDate())
    } else if (view === 'month') {
      if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
    } else {
      setYear(y => y + 1)
    }
  }

  const periodLabel = () => {
    if (view === 'day')   return `${String(day).padStart(2,'0')} de ${MONTHS_FULL[month]}`
    if (view === 'month') return `${MONTHS_FULL[month]} ${year}`
    return `${year}`
  }

  const isPresent =
    (view === 'day'   && sameDay(new Date(year, month, day), today)) ||
    (view === 'month' && year === today.getFullYear() && month === today.getMonth()) ||
    (view === 'year'  && year === today.getFullYear())

  function openAdd(d: Date, useTime = false) {
    setSheetDate(d)
    setSheetInitialTime(useTime ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : null)
    setSheetInitialClientId(null)
    setSheetInitialProcedureId(null)
    setSheetIgnoreBookingId(null)
    setSheetOpen(true)
  }

  async function cancelBooking() {
    if (!bookingAction) return
    await cancel.mutateAsync(bookingAction.id)
    setBookingAction(null)
  }

  async function rescheduleBooking() {
    if (!bookingAction) return
    const booking = bookingAction
    const start = new Date(booking.startTime)
    await cancel.mutateAsync(booking.id)
    setBookingAction(null)
    setSheetDate(start)
    setSheetInitialTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`)
    setSheetInitialClientId(booking.clientId)
    setSheetInitialProcedureId(booking.procedureId)
    setSheetIgnoreBookingId(booking.id)
    setSheetOpen(true)
  }

  function bookingsForDate(d: Date) {
    return (bookings ?? []).filter(b => sameDay(new Date(b.startTime), d))
  }

  // ── YEAR VIEW ──────────────────────────────────────────────────────────────
  function renderYear() {
    return (
      <div className="grid grid-cols-3 grid-rows-4 gap-2 h-full">
        {MONTHS_FULL.map((mName, i) => {
          const isCurrent = year === today.getFullYear() && i === today.getMonth()
          const total     = daysInMonth(year, i)
          const monthBookings = (bookings ?? []).filter(b => {
            const d = new Date(b.startTime)
            return d.getFullYear() === year && d.getMonth() === i
          })
          const bookedDays = new Set(monthBookings.map(b => new Date(b.startTime).getDate()))
          const bookingCount = monthBookings.length

          return (
            <button
              key={mName}
              onClick={() => { setMonth(i); setView('month') }}
              className={`flex flex-col bg-white rounded-2xl border p-3.5 text-left transition-all hover:border-rose-200 hover:shadow-sm active:scale-95 min-h-0 ${
                isCurrent ? 'border-rose-300 shadow-sm bg-rose-50/30' : 'border-stone-100'
              }`}
            >
              <div className="flex items-baseline justify-between mb-2">
                <p className={`text-sm font-bold ${isCurrent ? 'text-rose-500' : 'text-stone-500'}`}>
                  {MONTHS_SHORT[i]}
                </p>
                {bookingCount > 0 && (
                  <span className="text-[10px] font-semibold text-rose-400">{bookingCount}</span>
                )}
              </div>
              {/* Dot grid — cada dot = 1 dia */}
              <div className="flex flex-wrap gap-[3.5px] flex-1 content-start">
                {Array.from({ length: total }, (_, idx) => {
                  const d          = idx + 1
                  const isToday    = year === today.getFullYear() && i === today.getMonth() && d === today.getDate()
                  const hasBooking = bookedDays.has(d)
                  return (
                    <span
                      key={d}
                      className={`w-[8px] h-[8px] rounded-full ${
                        isToday    ? 'bg-rose-400' :
                        hasBooking ? 'bg-rose-200' :
                                     'bg-stone-100'
                      }`}
                    />
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  // ── MONTH VIEW (calendário grid) ───────────────────────────────────────────
  function renderMonth() {
    const firstDow = new Date(year, month, 1).getDay()
    const total    = daysInMonth(year, month)
    const cells: (number | null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: total }, (_, i) => i + 1),
    ]
    while (cells.length % 7 !== 0) cells.push(null)

    return (
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {/* Header dias da semana */}
        <div className="grid grid-cols-7 bg-primary">
          {DOW_LABELS.map((l, i) => (
            <div key={i} className="py-3 text-center text-xs font-bold text-white tracking-widest">
              {l}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {cells.map((d, idx) => {
            if (d === null) {
              return <div key={`e-${idx}`} className="h-20 bg-stone-50/60" />
            }
            const date        = new Date(year, month, d)
            const isToday     = sameDay(date, today)
            const isPast      = date < today && !isToday
            const dayBookings = bookingsForDate(date)

            return (
              <button
                key={`d-${d}`}
                onClick={() => { setDay(d); setView('day') }}
                className={`h-20 flex flex-col items-center justify-center gap-1 border border-stone-50 transition-colors active:bg-rose-50/70 ${
                  isToday ? 'bg-rose-50' : 'hover:bg-stone-50/80'
                }`}
              >
                <span className={`text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-rose-400 text-white ring-2 ring-rose-200' :
                  isPast  ? 'text-stone-300' :
                            'text-stone-700'
                }`}>
                  {d}
                </span>
                {dayBookings.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 rounded-full leading-tight ${
                    isToday ? 'bg-rose-200 text-rose-700' : 'bg-rose-100 text-rose-500'
                  }`}>
                    {dayBookings.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── DAY VIEW (timeline) ────────────────────────────────────────────────────
  function renderDay() {
    const currentDay  = new Date(year, month, day)
    const isPast      = currentDay < today && !sameDay(currentDay, today)
    const dayBookings = bookingsForDate(currentDay)
    const hours       = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)
    const totalHeight = (DAY_END - DAY_START) * HOUR_HEIGHT

    // Gera 30 dias antes e 30 depois — JS resolve rollover de mês automaticamente
    const stripDays = Array.from({ length: 61 }, (_, i) => new Date(year, month, day - 30 + i))

    return (
      <div className="relative bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {/* Cabeçalho: data completa */}
        

        {/* Strip horizontal de dias */}
        <div
          ref={stripRef}
          className="flex overflow-x-auto scrollbar-hide border-b border-stone-100 px-1 py-2 gap-0.5"
          style={{ scrollbarWidth: 'none' }}
        >
          {stripDays.map((d, idx) => {
            const isSelected  = sameDay(d, currentDay)
            const isDayToday  = sameDay(d, today)
            const isDayPast   = d < today && !isDayToday
            const isFirstMonth = d.getDate() === 1

            return (
              <div key={idx} className="flex flex-col items-center shrink-0 w-10">
                {/* Label de mês na virada */}
                <span className={`text-[9px] font-bold leading-none mb-0.5 ${isFirstMonth ? 'text-rose-400' : 'invisible'}`}>
                  {MONTHS_SHORT[d.getMonth()]}
                </span>
                {/* DOW */}
                <span className={`text-[10px] font-medium mb-1 ${
                  isSelected  ? 'text-rose-500' :
                  isDayPast   ? 'text-stone-300' :
                                'text-stone-400'
                }`}>
                  {DOW_LABELS[d.getDay()]}
                </span>
                {/* Número */}
                <button
                  ref={isSelected ? selectedDayRef : null}
                  onClick={() => { setYear(d.getFullYear()); setMonth(d.getMonth()); setDay(d.getDate()) }}
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                    isSelected  ? 'bg-rose-400 text-white shadow-sm' :
                    isDayToday  ? 'ring-2 ring-rose-300 text-rose-500' :
                    isDayPast   ? 'text-stone-300' :
                                  'text-stone-700 active:bg-stone-100'
                  }`}
                >
                  {d.getDate()}
                </button>
              </div>
            )
          })}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : (
          <div className="relative overflow-y-auto" style={{ height: `${Math.min(totalHeight, 480)}px` }}>
            <div className="relative" style={{ height: `${totalHeight}px` }}>
              {/* Linhas de hora */}
              {hours.map(h => (
                <div
                  key={h}
                  className="absolute w-full flex border-t border-stone-200"
                  style={{ top: `${(h - DAY_START) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="text-sm text-stone-500 px-2 pt-1 w-12 shrink-0 select-none font-medium">
                    {String(h).padStart(2,'0')}:00
                  </span>
                  {/* Meia hora */}
                  <div className="absolute left-0 right-0 flex items-start " style={{ top: `${HOUR_HEIGHT / 2}px` }}>
                    <span className="text-[11px] text-stone-300 px-2 w-12 shrink-0 select-none leading-none pt-0.5">
                      {String(h).padStart(2,'0')}:30
                    </span>
                  </div>
                  {/* Área clicável para agendar */}
                  {!isPast && (
                    <button
                      onClick={() => {
                        const selectedHour = new Date(year, month, day, h, 0, 0)
                        if (selectedHour.getTime() < today.getTime()) return
                        openAdd(selectedHour, true)
                      }}
                      className="flex-1 h-full hover:bg-rose-50/30 transition-colors"
                      aria-label={`Agendar às ${String(h).padStart(2,'0')}:00`}
                    />
                  )}
                </div>
              ))}

              {/* Blocos de agendamento */}
              {dayBookings.map(b => {
                const start      = new Date(b.startTime)
                const end        = new Date(b.endTime)
                const startMin   = (start.getHours() - DAY_START) * 60 + start.getMinutes()
                const durationMin = (end.getTime() - start.getTime()) / 60000
                const topPx      = startMin * (HOUR_HEIGHT / 60)
                const heightPx   = Math.max(durationMin * (HOUR_HEIGHT / 60), 32)
                const startLabel = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                const endLabel   = end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                return (
                  <button
                    key={b.id}
                    onClick={() => setBookingAction(b)}
                    className="absolute left-12 right-2 rounded-xl bg-primary px-2.5 py-1.5 text-left shadow-sm z-10 overflow-hidden transition-all hover:bg-rose-500 active:scale-[0.98]"
                    style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                  >
                    <p className="text-sm font-medium text-white truncate leading-tight">
                      {b.clientName ?? 'Cliente'}
                    </p>
                    {heightPx >= 44 && (
                      <p className="text-xs text-rose-50 truncate leading-tight">
                        {b.procedureName} · {startLabel}–{endLabel}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* FAB — Agendar */}
        {!isPast && (
          <button
            onClick={() => openAdd(currentDay)}
            className="absolute bottom-2 right-2 flex items-center gap-2 bg-rose-400 hover:bg-rose-500 active:scale-95 text-white text-sm font-semibold px-4 py-4 rounded-full shadow-lg transition-all z-20"
          >
            <Plus className="w-4 h-4" /> 
          </button>
        )}
      </div>
    )
  }

  // ── SHELL ──────────────────────────────────────────────────────────────────
  return (
    <div className={view === 'year' ? 'flex flex-col gap-3 h-[calc(100dvh-7rem)]' : 'space-y-3'}>

      {/* Navegação */}
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
        {/* Tabs */}
        <div className="flex bg-stone-100 rounded-xl p-0.5 gap-0.5">
          {(['day', 'month', 'year'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-[10px] transition-all ${
                view === v ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {v === 'day' ? 'Dia' : v === 'month' ? 'Mês' : 'Ano'}
            </button>
          ))}
        </div>

        {/* Prev / Label / Next */}
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-stone-400" />
          </button>
          <span className="text-sm font-medium text-stone-700">{periodLabel()}</span>
          <button
            onClick={next}
            disabled={view === 'day' && isPresent}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      </div>

      {/* View content */}
      {view === 'year'  && <div className="flex-1 min-h-0">{renderYear()}</div>}
      {view === 'month' && renderMonth()}
      {view === 'day'   && renderDay()}

      <AlertDialog open={!!bookingAction} onOpenChange={(open) => !open && setBookingAction(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {bookingAction?.clientName ?? 'Cliente'} esta agendada para {bookingAction ? new Date(bookingAction.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}.
              Voce pode apenas cancelar ou cancelar e reagendar essa cliente agora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancel.isPending}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={cancelBooking}
              disabled={cancel.isPending}
              className="bg-rose-100 text-rose-700 hover:bg-rose-200"
            >
              Cancelar
            </AlertDialogAction>
            <AlertDialogAction
              onClick={rescheduleBooking}
              disabled={cancel.isPending}
              className="bg-rose-400 text-white hover:bg-rose-500"
            >
              Reagendar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BookingSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialDate={sheetDate}
        initialTime={sheetInitialTime}
        initialClientId={sheetInitialClientId}
        initialProcedureId={sheetInitialProcedureId}
        ignoreBookingId={sheetIgnoreBookingId}
      />
    </div>
  )
}
