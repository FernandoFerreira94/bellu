// src/store/syncStore.ts
import { create } from 'zustand'

interface SyncStore {
  isSyncing: boolean
  message: string
  setSync: (syncing: boolean, message?: string) => void
}

export const useSyncStore = create<SyncStore>((set) => ({
  isSyncing: false,
  message: 'Sincronizando com Google Calendar...',
  setSync: (isSyncing, message) =>
    set({ isSyncing, message: message ?? 'Sincronizando com Google Calendar...' }),
}))
