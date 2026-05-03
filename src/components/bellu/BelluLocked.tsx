'use client'

import { Bot, Lock, MessageSquare, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export function BelluLocked() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center space-y-8 max-w-md mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-3xl bg-stone-50 border border-stone-100 flex items-center justify-center relative shadow-sm">
          <Bot className="w-12 h-12 text-stone-300" />
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white border border-stone-100 shadow-sm flex items-center justify-center">
            <Lock className="w-4 h-4 text-rose-300" />
          </div>
        </div>
        
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -inset-4 bg-rose-50/30 rounded-full blur-2xl -z-10"
        />
      </motion.div>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100/50 text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-2">
          <Sparkles className="w-3 h-3" />
          Premium feature
        </div>
        <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">
          Bellu IA não está ativada
        </h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          Esta funcionalidade é exclusiva para usuários habilitados. 
          A Bellu automatiza sua agenda, confirmações e muito mais.
        </p>
      </div>

      <div className="w-full pt-4 space-y-3">
        <Button 
          className="w-full bg-stone-800 hover:bg-stone-900 text-white border-none h-12 rounded-2xl shadow-lg shadow-stone-200/50"
          asChild
        >
          <a 
            href="https://wa.me/5512982143000" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Falar com a webcodeff
          </a>
        </Button>
        
        <p className="text-[11px] text-stone-400 font-medium">
          Dúvidas? Mande um "Olá" para saber mais sobre os planos.
        </p>
      </div>
    </div>
  )
}
