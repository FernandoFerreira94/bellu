// src/components/bellu/BelluSheet.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isTextUIPart, isToolUIPart } from 'ai'
import { Sparkles, RotateCcw, X, Send } from 'lucide-react'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useBelluUIStore } from '@/store/belluUIStore'

const QUICK_PROMPTS = [
  'Horários disponíveis esta semana',
  'Resumo financeiro da semana',
  'Quem tenho agendado hoje?',
  'Quero agendar uma cliente',
]

export function BelluSheet() {
  const { isSheetOpen, setSheetOpen, messages: stored, setMessages, resetChat } =
    useBelluUIStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')

  const { messages, sendMessage, setMessages: setChatMessages, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/bellu' }),
    messages: stored,
    onFinish: () => {
      setMessages(messages)
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Sincroniza ao fechar
  useEffect(() => {
    if (!isSheetOpen) setMessages(messages)
  }, [isSheetOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll para última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleReset() {
    resetChat()
    setChatMessages([])
    setInput('')
  }

  function handleQuickPrompt(prompt: string) {
    sendMessage({ text: prompt })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    sendMessage({ text })
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 flex flex-col gap-0"
        style={{ height: 'min(32rem, calc(100dvh - 4rem))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-semibold text-stone-800">Bellu</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-stone-400 hover:text-stone-600"
              onClick={handleReset}
              title="Resetar conversa"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-stone-400 hover:text-stone-600"
              onClick={() => setSheetOpen(false)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-xs text-stone-400 text-center mb-2">
                Como posso ajudar?
              </p>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleQuickPrompt(p)}
                  className="text-left text-sm px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m) => {
                // Tool calls em andamento
                const hasPendingTool = m.parts.some(
                  (p) => isToolUIPart(p) && p.state !== 'output-available',
                )
                if (hasPendingTool) {
                  return (
                    <div key={m.id} className="flex justify-start">
                      <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1.5 rounded-full animate-pulse">
                        buscando...
                      </span>
                    </div>
                  )
                }
                const textPart = m.parts.find(isTextUIPart)
                if (!textPart) return null
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex',
                      m.role === 'user' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[82%] text-sm px-3.5 py-2 rounded-2xl whitespace-pre-wrap',
                        m.role === 'user'
                          ? 'bg-rose-100 text-rose-900 rounded-br-sm'
                          : 'bg-stone-100 text-stone-800 rounded-bl-sm',
                      )}
                    >
                      {textPart.text}
                    </div>
                  </div>
                )
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1.5 rounded-full animate-pulse">
                    Bellu está digitando...
                  </span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 px-4 py-3 border-t border-stone-100 shrink-0"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Fale com a Bellu..."
            rows={1}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as unknown as React.FormEvent)
              }
            }}
            className="flex-1 resize-none rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-800 bg-transparent outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-9 w-9 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shrink-0 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
