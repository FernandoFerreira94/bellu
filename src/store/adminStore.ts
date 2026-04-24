// Placeholder — implementado na Fase 10 (Dashboard admin)
import { create } from 'zustand'

type AdminStore = {
  // Estado do painel admin — expandir nas fases seguintes
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useAdminStore = create<AdminStore>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
