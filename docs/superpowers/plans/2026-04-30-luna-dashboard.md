# Luna Dashboard Chat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar Luna chatbot IA no dashboard com streaming, tool use (agenda/clientes/financeiro), sheet bottom persistente e navegação atualizada.

**Architecture:** Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) com `streamText` no servidor e `useChat` no cliente. LunaSheet abre via bottom nav como `Sheet side="bottom"`. Histórico persiste em Zustand entre aberturas.

**Tech Stack:** Next.js 15 App Router, Vercel AI SDK, Anthropic claude-sonnet-4-6, Supabase, Zustand, shadcn/ui, TypeScript strict

---

## File Map

| Ação | Arquivo |
|---|---|
| Create | `src/lib/luna-context.ts` |
| Create | `src/lib/luna-tools.ts` |
| Create | `src/components/luna/luna-sheet.tsx` |
| Rewrite | `src/app/api/luna/route.ts` |
| Update | `src/store/lunaUIStore.ts` |
| Update | `src/app/dashboard/layout.tsx` |
| Update | `src/components/layout/bottom-nav.tsx` |
| Update | `src/components/layout/header-menu.tsx` |
| Update | `src/components/services/service-sheet.tsx` |
| Update | `src/hooks/useServices.ts` |
| Update | `src/types/index.ts` |
| Create/Update | `src/app/dashboard/settings/page.tsx` |

---

## Task 1: Install dependencies

**Files:** `package.json`, `package-lock.json`

- [ ] **Step 1: Instalar AI SDK**

```bash
npm install ai @ai-sdk/anthropic
```

- [ ] **Step 2: Verificar instalação**

```bash
npm ls ai @ai-sdk/anthropic
```

Esperado: versões listadas sem erros.

- [ ] **Step 3: Instalar shadcn Switch**

```bash
npx shadcn@latest add switch
```

Esperado: `src/components/ui/switch.tsx` criado.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/ui/switch.tsx
git commit -m "chore: install ai sdk, anthropic provider, shadcn switch"
```

---

## Task 2: Supabase migration — procedures.luna_enabled

**Files:** Supabase (via MCP)

- [ ] **Step 1: Aplicar migration via MCP**

```sql
ALTER TABLE procedures
ADD COLUMN luna_enabled boolean NOT NULL DEFAULT true;
```

Usar `mcp__claude_ai_Supabase__apply_migration` com project_id `xibcbjyhtvzlkgjbywru`.

- [ ] **Step 2: Verificar coluna**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'procedures' AND column_name = 'luna_enabled';
```

Esperado: 1 linha retornada com `default true`.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(db): add procedures.luna_enabled column"
```

---

## Task 3: Update Service type + useServices hook

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/hooks/useServices.ts`

- [ ] **Step 1: Adicionar `lunaEnabled` ao tipo Service em `src/types/index.ts`**

Localizar o tipo `Service` (linha ~9) e adicionar o campo:

```typescript
export type Service = {
  id: string;
  name: string;
  description: string | null;
  durationInMinutes: number;
  price: number;
  isActive: boolean;
  lunaEnabled: boolean;   // ← adicionar
  color: string | null;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 2: Atualizar `mapRow` em `src/hooks/useServices.ts`**

Adicionar `luna_enabled` ao select e ao mapRow:

```typescript
function mapRow(r: Record<string, unknown>): Service {
  return {
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) ?? null,
    durationInMinutes: r.duration as number,
    price: Number(r.price),
    isActive: r.active as boolean,
    lunaEnabled: r.luna_enabled as boolean,
    color: null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}
```

- [ ] **Step 3: Atualizar select em `useServices()`**

```typescript
.select('id, name, description, duration, price, active, luna_enabled, created_at, updated_at')
```

- [ ] **Step 4: Atualizar `ServiceInput` e mutations**

```typescript
type ServiceInput = {
  name: string
  description?: string | null
  durationInMinutes: number
  price: number
  lunaEnabled: boolean
}
```

Em `useCreateService` → `mutationFn`:
```typescript
const { error } = await sb.from('procedures').insert({
  name: input.name,
  description: input.description ?? null,
  duration: input.durationInMinutes,
  price: input.price,
  active: true,
  luna_enabled: input.lunaEnabled,
})
```

Em `useUpdateService` → `mutationFn`:
```typescript
const { error } = await sb.from('procedures').update({
  name: input.name,
  description: input.description ?? null,
  duration: input.durationInMinutes,
  price: input.price,
  luna_enabled: input.lunaEnabled,
}).eq('id', id)
```

- [ ] **Step 5: Build check**

```bash
npm run build 2>&1 | head -40
```

Esperado: sem erros de tipo no useServices.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/hooks/useServices.ts
git commit -m "feat: add lunaEnabled field to Service type and useServices hook"
```

---

## Task 4: Update ServiceSheet — toggle luna_enabled

**Files:**
- Modify: `src/components/services/service-sheet.tsx`

- [ ] **Step 1: Adicionar imports**

No topo do arquivo, adicionar ao bloco de imports existentes:

```typescript
import { Sparkles } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
```

- [ ] **Step 2: Adicionar estado `lunaEnabled`**

Após `const [confirmDelete, setConfirmDelete] = useState(false)`:

```typescript
const [lunaEnabled, setLunaEnabled] = useState(true)
```

- [ ] **Step 3: Setar lunaEnabled no useEffect**

No bloco `if (mode === 'edit' && service)`, adicionar:
```typescript
setLunaEnabled(service.lunaEnabled ?? true)
```

No bloco `else`, adicionar:
```typescript
setLunaEnabled(true)
```

- [ ] **Step 4: Incluir lunaEnabled no input do handleSave**

```typescript
const input = {
  name: name.trim(),
  description: description.trim() || null,
  price: priceCents / 100,
  durationInMinutes: parseInt(duration),
  lunaEnabled,
}
```

- [ ] **Step 5: Adicionar Switch na UI — antes do botão Salvar**

Após o grid de Preço + Duração e antes do botão Salvar:

```tsx
{/* Luna */}
<div className="flex items-center justify-between px-1 py-1">
  <Label className="text-xs text-stone-500 flex items-center gap-2">
    <Sparkles className="w-3.5 h-3.5 text-rose-300" />
    Luna pode oferecer este serviço
  </Label>
  <Switch
    checked={lunaEnabled}
    onCheckedChange={setLunaEnabled}
  />
</div>
```

- [ ] **Step 6: Build check**

```bash
npm run build 2>&1 | head -40
```

- [ ] **Step 7: Commit**

```bash
git add src/components/services/service-sheet.tsx
git commit -m "feat: add luna_enabled toggle to ServiceSheet"
```

---

## Task 5: Create luna-context.ts

**Files:**
- Create: `src/lib/luna-context.ts`

- [ ] **Step 1: Criar arquivo**

```typescript
// src/lib/luna-context.ts
import { createSupabaseServerClient } from '@/lib/supabase-server'

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export async function buildLunaSystemPrompt(): Promise<string> {
  const supabase = await createSupabaseServerClient()

  const [{ data: profile }, { data: workingHours }, { data: procedures }] = await Promise.all([
    supabase
      .from('studio_profile')
      .select('studio_name, owner_name')
      .single(),
    supabase
      .from('working_hours')
      .select('day_of_week, start_time, end_time, active')
      .order('day_of_week'),
    supabase
      .from('procedures')
      .select('id, name, duration, price')
      .eq('luna_enabled', true)
      .eq('active', true)
      .order('name'),
  ])

  const schedule = (workingHours ?? [])
    .map((wh) => {
      const label = DAY_NAMES[wh.day_of_week] ?? `Dia ${wh.day_of_week}`
      const horario = wh.active
        ? `${wh.start_time.slice(0, 5)} – ${wh.end_time.slice(0, 5)}`
        : 'Folga'
      return `${label}: ${horario}`
    })
    .join('\n')

  const servicesList = (procedures ?? [])
    .map((p) => `- ${p.name}: ${p.duration} min, R$ ${Number(p.price).toFixed(2)}`)
    .join('\n')

  const now = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'short',
  })

  const ownerName = profile?.owner_name ?? 'profissional'
  const studioName = profile?.studio_name ?? 'estúdio'

  return `Você é Luna, assistente pessoal da ${ownerName} do ${studioName}.
Data e hora atual: ${now}

Horários de trabalho:
${schedule || 'Não configurado'}

Serviços disponíveis (você pode oferecer):
${servicesList || 'Nenhum serviço cadastrado'}

Regras obrigatórias:
- Buffer mínimo de 30 minutos entre procedimentos.
- Nunca agendar fora do horário de trabalho configurado.
- Confirme antes de cancelar qualquer agendamento.
- Linguagem informal, como assistente pessoal.
- Respostas curtas; detalhes só se pedido.
- Ao criar agendamento, confirme nome da cliente, procedimento e horário antes de salvar.`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/luna-context.ts
git commit -m "feat: add luna-context — system prompt builder"
```

---

## Task 6: Create luna-tools.ts

**Files:**
- Create: `src/lib/luna-tools.ts`

- [ ] **Step 1: Criar arquivo com 6 tools**

```typescript
// src/lib/luna-tools.ts
import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const lunaTools = {
  get_available_slots: tool({
    description: 'Retorna horários disponíveis para um procedimento em uma data específica',
    parameters: z.object({
      date: z.string().describe('Data no formato YYYY-MM-DD'),
      procedure_id: z.string().uuid().describe('ID do procedimento'),
    }),
    execute: async ({ date, procedure_id }) => {
      const supabase = await createSupabaseServerClient()

      const { data: procedure } = await supabase
        .from('procedures')
        .select('duration, name')
        .eq('id', procedure_id)
        .single()
      if (!procedure) return { error: 'Procedimento não encontrado' }

      // 0 = Sunday, 1 = Monday, ...
      const dayOfWeek = new Date(`${date}T12:00:00`).getDay()
      const { data: wh } = await supabase
        .from('working_hours')
        .select('start_time, end_time, active')
        .eq('day_of_week', dayOfWeek)
        .single()
      if (!wh || !wh.active) {
        return { slots: [], reason: 'Sem expediente neste dia' }
      }

      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .gte('start_time', `${date}T00:00:00+00:00`)
        .lte('start_time', `${date}T23:59:59+00:00`)
        .neq('status', 'cancelled')

      const [sh, sm] = wh.start_time.split(':').map(Number)
      const [eh, em] = wh.end_time.split(':').map(Number)
      const startMin = sh * 60 + sm
      const endMin = eh * 60 + em
      const BUFFER = 30
      const slots: string[] = []

      for (let t = startMin; t + procedure.duration + BUFFER <= endMin; t += 30) {
        const hh = String(Math.floor(t / 60)).padStart(2, '0')
        const mm = String(t % 60).padStart(2, '0')
        const slotStartMs = new Date(`${date}T${hh}:${mm}:00`).getTime()
        const slotEndMs = slotStartMs + (procedure.duration + BUFFER) * 60_000

        const conflict = (bookings ?? []).some((b) => {
          const bs = new Date(b.start_time).getTime() - BUFFER * 60_000
          const be = new Date(b.end_time).getTime() + BUFFER * 60_000
          return slotStartMs < be && slotEndMs > bs
        })

        if (!conflict) slots.push(`${hh}:${mm}`)
      }

      return { date, procedure: procedure.name, duration: procedure.duration, slots }
    },
  }),

  get_bookings: tool({
    description: 'Retorna agendamentos em um período',
    parameters: z.object({
      from: z.string().describe('Data início YYYY-MM-DD'),
      to: z.string().describe('Data fim YYYY-MM-DD'),
    }),
    execute: async ({ from, to }) => {
      const supabase = await createSupabaseServerClient()
      const { data, error } = await supabase
        .from('bookings')
        .select('id, start_time, end_time, status, notes, clients(name, phone), procedures(name, duration, price)')
        .gte('start_time', `${from}T00:00:00+00:00`)
        .lte('start_time', `${to}T23:59:59+00:00`)
        .neq('status', 'cancelled')
        .order('start_time')
      if (error) return { error: error.message }
      return data ?? []
    },
  }),

  create_booking: tool({
    description: 'Cria um agendamento para uma cliente. Confirme com a profissional antes de chamar.',
    parameters: z.object({
      client_id: z.string().uuid().describe('ID da cliente'),
      procedure_id: z.string().uuid().describe('ID do procedimento'),
      start_time: z.string().describe('Horário de início no formato ISO 8601, ex: 2026-05-01T09:00:00'),
    }),
    execute: async ({ client_id, procedure_id, start_time }) => {
      const supabase = await createSupabaseServerClient()

      const { data: procedure } = await supabase
        .from('procedures')
        .select('duration')
        .eq('id', procedure_id)
        .single()
      if (!procedure) return { error: 'Procedimento não encontrado' }

      const startDate = new Date(start_time)
      const endDate = new Date(startDate.getTime() + procedure.duration * 60_000)

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          client_id,
          procedure_id,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          status: 'confirmed',
        })
        .select('id, start_time, end_time')
        .single()

      if (error) return { error: error.message }
      return { success: true, booking: data }
    },
  }),

  cancel_booking: tool({
    description: 'Cancela um agendamento por ID. Confirme com a profissional antes de chamar.',
    parameters: z.object({
      booking_id: z.string().uuid().describe('ID do agendamento'),
    }),
    execute: async ({ booking_id }) => {
      const supabase = await createSupabaseServerClient()
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking_id)
      if (error) return { error: error.message }
      return { success: true }
    },
  }),

  get_clients: tool({
    description: 'Busca clientes por nome ou telefone',
    parameters: z.object({
      search: z.string().optional().describe('Texto para buscar por nome ou telefone (opcional)'),
    }),
    execute: async ({ search }) => {
      const supabase = await createSupabaseServerClient()
      let query = supabase
        .from('clients')
        .select('id, name, phone, email')
        .order('name')
        .limit(10)
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
      }
      const { data, error } = await query
      if (error) return { error: error.message }
      return data ?? []
    },
  }),

  get_financial_summary: tool({
    description: 'Retorna resumo financeiro (receita, despesas, lucro) de um período',
    parameters: z.object({
      from: z.string().describe('Data início YYYY-MM-DD'),
      to: z.string().describe('Data fim YYYY-MM-DD'),
    }),
    execute: async ({ from, to }) => {
      const supabase = await createSupabaseServerClient()
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .gte('date', from)
        .lte('date', to)
      if (error) return { error: error.message }

      const rows = data ?? []
      const totalIncome = rows
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + Number(t.amount), 0)
      const totalExpenses = rows
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + Number(t.amount), 0)

      return {
        period: `${from} a ${to}`,
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
      }
    },
  }),
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | head -50
```

Esperado: sem erros de tipo.

- [ ] **Step 3: Commit**

```bash
git add src/lib/luna-tools.ts
git commit -m "feat: add luna tools (6 tools — slots, bookings, clients, finance)"
```

---

## Task 7: Rewrite /api/luna/route.ts

**Files:**
- Modify: `src/app/api/luna/route.ts`

- [ ] **Step 1: Reescrever o arquivo**

```typescript
// src/app/api/luna/route.ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { buildLunaSystemPrompt } from '@/lib/luna-context'
import { lunaTools } from '@/lib/luna-tools'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages } = await request.json()
  const system = await buildLunaSystemPrompt()

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system,
    messages,
    tools: lunaTools,
    maxSteps: 5,
  })

  return result.toDataStreamResponse()
}
```

- [ ] **Step 2: Garantir que `ANTHROPIC_API_KEY` está no `.env.local`**

```bash
grep ANTHROPIC_API_KEY .env.local
```

Se não existir, adicionar: `ANTHROPIC_API_KEY=sk-ant-...`

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | head -50
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/luna/route.ts
git commit -m "feat: rewrite /api/luna with streamText + tools"
```

---

## Task 8: Update lunaUIStore

**Files:**
- Modify: `src/store/lunaUIStore.ts`

- [ ] **Step 1: Reescrever o store**

```typescript
// src/store/lunaUIStore.ts
import { create } from 'zustand'
import type { Message } from 'ai'

type LunaUIStore = {
  isSheetOpen: boolean
  setSheetOpen: (open: boolean) => void
  messages: Message[]
  setMessages: (messages: Message[]) => void
  resetChat: () => void
  // legacy — header-menu ainda usa
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
```

- [ ] **Step 2: Commit**

```bash
git add src/store/lunaUIStore.ts
git commit -m "feat: update lunaUIStore — add messages persistence + sheet state"
```

---

## Task 9: Create luna-sheet.tsx

**Files:**
- Create: `src/components/luna/luna-sheet.tsx`

- [ ] **Step 1: Criar componente**

```tsx
// src/components/luna/luna-sheet.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useChat } from 'ai/react'
import { Sparkles, RotateCcw, X, Send } from 'lucide-react'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useLunaUIStore } from '@/store/lunaUIStore'

const QUICK_PROMPTS = [
  'Horários disponíveis esta semana',
  'Resumo financeiro da semana',
  'Quem tenho agendado hoje?',
  'Quero agendar uma cliente',
]

export function LunaSheet() {
  const { isSheetOpen, setSheetOpen, messages: stored, setMessages, resetChat } =
    useLunaUIStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages: setChatMessages,
    append,
  } = useChat({
    api: '/api/luna',
    initialMessages: stored,
    onFinish: () => {
      setMessages(messages)
    },
  })

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
  }

  function handleQuickPrompt(prompt: string) {
    append({ role: 'user', content: prompt })
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
            <span className="text-sm font-semibold text-stone-800">Luna</span>
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
                if (m.toolInvocations?.some((t) => t.state !== 'result')) {
                  return (
                    <div key={m.id} className="flex justify-start">
                      <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1.5 rounded-full animate-pulse">
                        buscando...
                      </span>
                    </div>
                  )
                }
                if (!m.content) return null
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
                      {m.content}
                    </div>
                  </div>
                )
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1.5 rounded-full animate-pulse">
                    Luna está digitando...
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
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Fale com a Luna..."
            rows={1}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
              }
            }}
            className="flex-1 resize-none rounded-xl border-stone-200 min-h-0 py-2.5 text-sm focus-visible:ring-rose-300"
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
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | head -50
```

- [ ] **Step 3: Commit**

```bash
git add src/components/luna/luna-sheet.tsx
git commit -m "feat: add LunaSheet — chat UI with streaming, quick prompts, persistence"
```

---

## Task 10: Update dashboard layout

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Trocar LunaWidget por LunaSheet**

```typescript
// Remover:
import { LunaWidget } from "@/components/luna/luna-widget";

// Adicionar:
import { LunaSheet } from "@/components/luna/luna-sheet";
```

```tsx
// Remover:
<LunaWidget />

// Adicionar:
<LunaSheet />
```

- [ ] **Step 2: Build check + commit**

```bash
npm run build 2>&1 | head -30
git add src/app/dashboard/layout.tsx
git commit -m "feat: replace LunaWidget with LunaSheet in dashboard layout"
```

---

## Task 11: Update bottom-nav.tsx — swap Finance → Luna

**Files:**
- Modify: `src/components/layout/bottom-nav.tsx`

- [ ] **Step 1: Reescrever bottom-nav**

```tsx
// src/components/layout/bottom-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Users, Sparkles } from "lucide-react";
import { useLunaUIStore } from "@/store/lunaUIStore";

export function BottomNav() {
  const pathname = usePathname();
  const setSheetOpen = useLunaUIStore((s) => s.setSheetOpen);

  const navItems = [
    { href: "/dashboard", label: "Início", icon: Home, match: "/dashboard" },
    { href: "/dashboard/calendar", label: "Agenda", icon: Calendar, match: "/dashboard/calendar" },
    { href: "/dashboard/clients", label: "Clientes", icon: Users, match: "/dashboard/clients" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-stone-200/50 pb-safe z-50 lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-around px-2 py-3 h-16">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                isActive ? "text-primary" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Luna — abre Sheet */}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-full h-full transition-colors text-stone-400 hover:text-rose-400"
        >
          <Sparkles className="w-5 h-5" strokeWidth={2} />
          <span className="text-[10px] font-medium">Luna</span>
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Build check + commit**

```bash
npm run build 2>&1 | head -30
git add src/components/layout/bottom-nav.tsx
git commit -m "feat: swap Finance → Luna in bottom nav"
```

---

## Task 12: Update header-menu.tsx — add Financeiro link

**Files:**
- Modify: `src/components/layout/header-menu.tsx`

- [ ] **Step 1: Atualizar imports**

Adicionar `TrendingUp` aos imports do lucide:
```typescript
import {
  LogOut, Calendar, Clock, Plug, Sparkles,
  CheckCircle2, XCircle, Camera, X, Pencil, Check, ChevronRight, TrendingUp,
} from 'lucide-react'
```

- [ ] **Step 2: Atualizar referência a `setWidgetOpen` para `setSheetOpen`**

```typescript
// Remover:
const setWidgetOpen = useLunaUIStore((s) => s.setWidgetOpen)

// Adicionar:
const setSheetOpen = useLunaUIStore((s) => s.setSheetOpen)
```

- [ ] **Step 3: Trocar `setWidgetOpen(true)` por `setSheetOpen(true)` no botão Luna**

Localizar o botão Luna (linha ~228) e atualizar:
```tsx
<button
  onClick={() => { setSheetOpen(true); onClose() }}
  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors text-sm"
>
  <Sparkles className="w-4 h-4 shrink-0 text-rose-300" />
  Luna ✨
</button>
```

- [ ] **Step 4: Adicionar link Financeiro — antes do botão Luna**

```tsx
<Link
  href="/dashboard/finance"
  onClick={onClose}
  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors text-sm"
>
  <TrendingUp className="w-4 h-4 shrink-0 text-stone-400" />
  Financeiro
</Link>
```

- [ ] **Step 5: Build check + commit**

```bash
npm run build 2>&1 | head -30
git add src/components/layout/header-menu.tsx
git commit -m "feat: add Financeiro to header menu, update Luna to open sheet"
```

---

## Task 13: Settings — Working Hours UI

**Files:**
- Create/Modify: `src/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Verificar se o arquivo existe**

```bash
ls src/app/dashboard/settings/
```

- [ ] **Step 2: Criar/substituir `src/app/dashboard/settings/page.tsx`**

```tsx
// src/app/dashboard/settings/page.tsx
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { sb } from '@/lib/supabase-browser'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

type WorkingHourRow = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

type DraftRow = {
  id: string | null
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

function buildDefaults(): DraftRow[] {
  return DAY_NAMES.map((_, i) => ({
    id: null,
    day_of_week: i,
    start_time: '08:00',
    end_time: '18:00',
    active: i >= 1 && i <= 5, // Segunda–Sexta
  }))
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const [draft, setDraft] = useState<DraftRow[] | null>(null)

  const { isLoading } = useQuery<WorkingHourRow[]>({
    queryKey: ['working_hours'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('working_hours')
        .select('id, day_of_week, start_time, end_time, active')
        .order('day_of_week')
      if (error) throw error
      return data ?? []
    },
    onSuccess: (data) => {
      const defaults = buildDefaults()
      const merged = defaults.map((d) => {
        const found = data.find((r) => r.day_of_week === d.day_of_week)
        if (!found) return d
        return {
          id: found.id,
          day_of_week: found.day_of_week,
          start_time: found.start_time.slice(0, 5),
          end_time: found.end_time.slice(0, 5),
          active: found.active,
        }
      })
      setDraft(merged)
    },
  })

  const save = useMutation({
    mutationFn: async (rows: DraftRow[]) => {
      for (const row of rows) {
        const payload = {
          day_of_week: row.day_of_week,
          start_time: row.start_time,
          end_time: row.end_time,
          active: row.active,
        }
        if (row.id) {
          const { error } = await sb
            .from('working_hours')
            .update(payload)
            .eq('id', row.id)
          if (error) throw error
        } else {
          const { error } = await sb
            .from('working_hours')
            .insert(payload)
          if (error) throw error
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['working_hours'] })
      toast.success('Horários salvos!')
    },
    onError: () => toast.error('Erro ao salvar horários'),
  })

  function update(index: number, field: keyof DraftRow, value: string | boolean) {
    setDraft((prev) =>
      prev ? prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)) : prev,
    )
  }

  if (isLoading || !draft) {
    return (
      <div className="px-4 py-6 space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-stone-100 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-4 h-4 text-rose-400" />
        <h1 className="text-base font-semibold text-stone-800">Horários de expediente</h1>
      </div>

      <div className="space-y-3">
        {draft.map((row, i) => (
          <div
            key={row.day_of_week}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors ${
              row.active ? 'border-stone-200 bg-white' : 'border-stone-100 bg-stone-50'
            }`}
          >
            <Switch
              checked={row.active}
              onCheckedChange={(v) => update(i, 'active', v)}
            />
            <Label className={`w-16 text-sm font-medium ${row.active ? 'text-stone-700' : 'text-stone-400'}`}>
              {DAY_NAMES[row.day_of_week]}
            </Label>
            {row.active ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={row.start_time}
                  onChange={(e) => update(i, 'start_time', e.target.value)}
                  className="flex-1 text-sm rounded-xl border border-stone-200 px-2 py-1.5 text-stone-700 outline-none focus:border-rose-300"
                />
                <span className="text-xs text-stone-400">até</span>
                <input
                  type="time"
                  value={row.end_time}
                  onChange={(e) => update(i, 'end_time', e.target.value)}
                  className="flex-1 text-sm rounded-xl border border-stone-200 px-2 py-1.5 text-stone-700 outline-none focus:border-rose-300"
                />
              </div>
            ) : (
              <span className="text-xs text-stone-400 flex-1">Folga</span>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={() => save.mutate(draft)}
        disabled={save.isPending}
        className="w-full mt-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium disabled:opacity-40"
      >
        {save.isPending ? 'Salvando...' : 'Salvar horários'}
      </Button>
    </div>
  )
}
```

> **Nota:** `onSuccess` no useQuery requer `@tanstack/react-query` v4. Se estiver em v5 (callbacks foram removidas), substituir por `useEffect` com dependência nos dados do query.

- [ ] **Step 3: Verificar versão do TanStack Query**

```bash
npm ls @tanstack/react-query
```

Se v5, a settings page usa padrão diferente para `onSuccess`. Substituir o `useQuery` por:

```typescript
const { data: savedHours, isLoading } = useQuery<WorkingHourRow[]>({
  queryKey: ['working_hours'],
  queryFn: async () => {
    const { data, error } = await sb
      .from('working_hours')
      .select('id, day_of_week, start_time, end_time, active')
      .order('day_of_week')
    if (error) throw error
    return data ?? []
  },
})

// No componente, após o hook:
useEffect(() => {
  if (!savedHours || draft) return
  const defaults = buildDefaults()
  const merged = defaults.map((d) => {
    const found = savedHours.find((r) => r.day_of_week === d.day_of_week)
    if (!found) return d
    return {
      id: found.id,
      day_of_week: found.day_of_week,
      start_time: found.start_time.slice(0, 5),
      end_time: found.end_time.slice(0, 5),
      active: found.active,
    }
  })
  setDraft(merged)
}, [savedHours]) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 4: Build check + commit**

```bash
npm run build 2>&1 | head -50
git add src/app/dashboard/settings/
git commit -m "feat: working hours settings page"
```

---

## Task 14: Final build verification

- [ ] **Step 1: Build limpo**

```bash
npm run build
```

Esperado: `✓ Compiled successfully` sem erros de tipo ou lint.

- [ ] **Step 2: Testar fluxo manual em dev**

```bash
npm run dev
```

Checklist:
- [ ] Bottom nav mostra "Luna" no lugar de "Financeiro"
- [ ] Tap em "Luna" abre sheet bottom
- [ ] Quick prompts aparecem quando chat vazio
- [ ] Enviar mensagem → resposta em streaming
- [ ] Fechar e reabrir → mensagens persistem
- [ ] Botão reset → chat limpa, quick prompts voltam
- [ ] ServiceSheet → toggle "Luna pode oferecer" aparece
- [ ] Settings → horários de expediente carregam e salvam
- [ ] Header menu → link "Financeiro" navega para /dashboard/finance

---

## Próximo passo

Após este plano: **Plan B — WhatsApp** (`2026-04-30-luna-whatsapp.md`)
