import { create } from 'zustand'
import type { Procedure, TimeSlot } from '@/types'

type ScheduleStore = {
  selectedProcedure: Procedure | null
  selectedDate: Date | null
  selectedSlot: TimeSlot | null
  clientPhone: string
  clientName: string
  setSelectedProcedure: (p: Procedure | null) => void
  setSelectedDate: (d: Date | null) => void
  setSelectedSlot: (s: TimeSlot | null) => void
  setClientPhone: (phone: string) => void
  setClientName: (name: string) => void
  reset: () => void
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  selectedProcedure: null,
  selectedDate: null,
  selectedSlot: null,
  clientPhone: '',
  clientName: '',
  setSelectedProcedure: (p) => set({ selectedProcedure: p }),
  setSelectedDate: (d) => set({ selectedDate: d }),
  setSelectedSlot: (s) => set({ selectedSlot: s }),
  setClientPhone: (phone) => set({ clientPhone: phone }),
  setClientName: (name) => set({ clientName: name }),
  reset: () => set({
    selectedProcedure: null,
    selectedDate: null,
    selectedSlot: null,
    clientPhone: '',
    clientName: '',
  }),
}))
