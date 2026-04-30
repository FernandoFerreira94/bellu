// src/store/lunaUIStore.ts
import { create } from 'zustand'
import type { UIMessage } from 'ai'

type LunaUIStore = {
  isSheetOpen: boolean
  setSheetOpen: (open: boolean) => void
  messages: UIMessage[]
  setMessages: (messages: UIMessage[]) => void
  resetChat: () => void
  // legacy — header-menu still uses this
  isWidgetOpen: boolean
  setWidgetOpen: (open: boolean) => void
}

export const useLunaUIStore = create<LunaUIStore>((set) => ({
  isSheetOpen: false,
  setSheetOpen: (isSheetOpen) => set({ isSheetOpen }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  resetChat: () => set({ messages: [] }),
  isWidgetOpen: false,
  setWidgetOpen: (isWidgetOpen) => set({ isWidgetOpen }),
}))
