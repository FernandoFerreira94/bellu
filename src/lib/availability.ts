/**
 * Lógica de slots disponíveis.
 * Regras:
 * - Expediente: working_hours da semana (padrão 08:00–18:00)
 * - Nunca antes de 08:00 ou depois de 18:00
 * - Antecedência mínima: 2 horas
 * - Slots de 30 em 30 minutos
 * - Descontar bookings existentes (start_time..end_time)
 * - Buffer: 0 min por padrão (configurável)
 */

export type TimeSlot = {
  start: Date
  end: Date
}

type WorkingHour = {
  day_of_week: number   // 0=dom, 6=sab
  start_time: string    // '08:00:00'
  end_time: string      // '18:00:00'
  active: boolean
}

type ExistingBooking = {
  startTime: string     // ISO
  endTime: string       // ISO
}

const SLOT_INTERVAL = 30        // minutos entre slots
const MIN_ADVANCE_HOURS = 2     // antecedência mínima

function parseTime(date: Date, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d
}

export function getAvailableSlots(
  date: Date,
  durationMinutes: number,
  workingHours: WorkingHour[],
  existingBookings: ExistingBooking[],
  bufferMinutes = 0,
): TimeSlot[] {
  const dayOfWeek = date.getDay()
  const wh = workingHours.find((w) => w.day_of_week === dayOfWeek && w.active)
  if (!wh) return []

  const dayStart = parseTime(date, wh.start_time)
  const dayEnd = parseTime(date, wh.end_time)
  const now = new Date()
  const minStart = new Date(now.getTime() + MIN_ADVANCE_HOURS * 60 * 60 * 1000)

  const slots: TimeSlot[] = []
  let cursor = new Date(dayStart)

  while (cursor < dayEnd) {
    const slotEnd = new Date(cursor.getTime() + (durationMinutes + bufferMinutes) * 60 * 1000)

    if (slotEnd > dayEnd) break
    if (cursor < minStart) { cursor = new Date(cursor.getTime() + SLOT_INTERVAL * 60 * 1000); continue }

    const hasConflict = existingBookings.some((b) => {
      const bStart = new Date(b.startTime)
      const bEnd = new Date(b.endTime)
      return cursor < bEnd && slotEnd > bStart
    })

    if (!hasConflict) {
      slots.push({ start: new Date(cursor), end: slotEnd })
    }

    cursor = new Date(cursor.getTime() + SLOT_INTERVAL * 60 * 1000)
  }

  return slots
}

export function formatSlotTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
