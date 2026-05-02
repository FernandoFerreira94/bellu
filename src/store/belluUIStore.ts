// src/store/belluUIStore.ts
import { create } from 'zustand'
import type { UIMessage } from 'ai'

type BelluUIStore = {
  isSheetOpen: boolean
  setSheetOpen: (open: boolean) => void
  messages: UIMessage[]
  setMessages: (messages: UIMessage[]) => void
  resetChat: () => void
  isWidgetOpen: boolean
  setWidgetOpen: (open: boolean) => void
}

export const useBelluUIStore = create<BelluUIStore>((set) => ({
  isSheetOpen: false,
  setSheetOpen: (isSheetOpen) => set({ isSheetOpen }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  resetChat: () => set({ messages: [] }),
  isWidgetOpen: false,
  setWidgetOpen: (isWidgetOpen) => set({ isWidgetOpen }),
}))
