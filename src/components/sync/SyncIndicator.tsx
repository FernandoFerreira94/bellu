'use client'

import { useSyncStore } from '@/store/syncStore'
import { Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

export function SyncIndicator() {
  const { isSyncing, message } = useSyncStore()

  return (
    <AnimatePresence>
      {isSyncing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 bg-white border border-stone-200 rounded-full px-3 py-1.5 shadow-md text-xs text-stone-600"
        >
          <Loader2 className="h-3 w-3 animate-spin text-rose-500 shrink-0" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
