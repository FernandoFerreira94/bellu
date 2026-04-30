import { WeekView } from '@/components/calendar/week-view'

export default function CalendarPage() {
  return (
    <section className="space-y-4 px-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-stone-400">Agenda</p>
        <h2 className="mt-1 text-2xl font-semibold text-stone-800">Calendário</h2>
      </div>
      <WeekView />
    </section>
  )
}
