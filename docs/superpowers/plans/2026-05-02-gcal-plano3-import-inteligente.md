# Plano 3 — DB Migration + Importação Inteligente

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar tabela `google_calendar_events`, adicionar coluna em `procedures`, e implementar o endpoint de importação batch que usa IA (Claude) para parsear eventos do Google Calendar e criar clientes, procedimentos (stubs) e bookings automaticamente.

**Architecture:** Endpoint `/api/google-calendar/import` recebe trigger (pós-OAuth ou manual). Busca todos os eventos do Google Calendar (2 semanas atrás + futuros). Envia batch para Claude em uma única chamada. Claude retorna JSON estruturado. Sistema salva clientes, procedimentos stubs, bookings e eventos pessoais. UI exibe ícone de sync no canto inferior direito durante o processo.

**Tech Stack:** Next.js 15, Supabase MCP, Anthropic SDK (AI SDK), Google Calendar API

**Responsável:** Claude

> ⚠️ Depende do Plano 2 (OAuth + tokens) estar implementado.
> ⚠️ Depende de `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ANTHROPIC_API_KEY` configurados.

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| Migration Supabase | Criar via MCP | Tabela `google_calendar_events` + coluna `procedures.google_calendar_title` |
| `src/lib/google-calendar-api.ts` | Criar | Chamadas reais à Google Calendar REST API |
| `src/lib/bellu-import.ts` | Criar | Lógica batch IA: parsear eventos → JSON estruturado |
| `src/app/api/google-calendar/import/route.ts` | Criar | Endpoint que orquestra importação |
| `src/store/syncStore.ts` | Criar | Estado de sync (issyncing, progress) |
| `src/components/sync/SyncIndicator.tsx` | Criar | Ícone canto inferior direito |
| `src/app/dashboard/layout.tsx` | Modificar | Adicionar SyncIndicator |

---

### Task 1: Migration Supabase

**Files:**
- Migration via MCP Supabase

- [ ] Aplicar migration via MCP Supabase:

```sql
-- Tabela para eventos do Google Calendar (pessoais + espelhados)
create table if not exists google_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_event_id text not null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_personal boolean not null default true,
  synced_at timestamptz not null default now(),
  unique(user_id, google_event_id)
);

alter table google_calendar_events enable row level security;

create policy "Usuário vê próprios eventos gcal"
  on google_calendar_events for all
  using (auth.uid() = user_id);

-- Coluna para mapear procedimento ao título do Google Calendar
alter table procedures
  add column if not exists google_calendar_title text;
```

- [ ] Confirmar que tabela foi criada consultando via MCP
- [ ] Commit:
```bash
git add -A
git commit -m "feat: add google_calendar_events table and procedures.google_calendar_title"
```

---

### Task 2: Criar Google Calendar API client

**Files:**
- Create: `src/lib/google-calendar-api.ts`

- [ ] Criar `src/lib/google-calendar-api.ts`:

```typescript
// src/lib/google-calendar-api.ts
import { getValidAccessToken } from '@/lib/google-token'

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3'

export interface GCalEvent {
  id: string
  summary?: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  status?: string
}

export async function fetchGoogleCalendarEvents(params: {
  timeMin: string
  timeMax?: string
  maxResults?: number
}): Promise<GCalEvent[]> {
  const token = await getValidAccessToken()
  if (!token) return []

  const query = new URLSearchParams({
    timeMin: params.timeMin,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(params.maxResults ?? 500),
  })
  if (params.timeMax) query.set('timeMax', params.timeMax)

  const res = await fetch(
    `${GCAL_BASE}/calendars/primary/events?${query.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) return []
  const data = await res.json()
  return (data.items ?? []) as GCalEvent[]
}

export async function createGCalEvent(params: {
  summary: string
  start: string
  end: string
}): Promise<string | null> {
  const token = await getValidAccessToken()
  if (!token) return null

  const res = await fetch(`${GCAL_BASE}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: params.summary,
      start: { dateTime: params.start, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: params.end, timeZone: 'America/Sao_Paulo' },
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.id ?? null
}

export async function updateGCalEvent(params: {
  eventId: string
  summary: string
  start: string
  end: string
}): Promise<void> {
  const token = await getValidAccessToken()
  if (!token) return

  await fetch(`${GCAL_BASE}/calendars/primary/events/${params.eventId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: params.summary,
      start: { dateTime: params.start, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: params.end, timeZone: 'America/Sao_Paulo' },
    }),
  })
}

export async function deleteGCalEvent(eventId: string): Promise<void> {
  const token = await getValidAccessToken()
  if (!token) return

  await fetch(`${GCAL_BASE}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function registerGCalWebhook(params: {
  channelId: string
  callbackUrl: string
}): Promise<{ expiration: string } | null> {
  const token = await getValidAccessToken()
  if (!token) return null

  const res = await fetch(`${GCAL_BASE}/calendars/primary/events/watch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: params.channelId,
      type: 'web_hook',
      address: params.callbackUrl,
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  return { expiration: data.expiration }
}
```

- [ ] Commit:
```bash
git add src/lib/google-calendar-api.ts
git commit -m "feat: add google calendar api client (fetch, create, update, delete, webhook)"
```

---

### Task 3: Criar lógica de importação batch com IA

**Files:**
- Create: `src/lib/bellu-import.ts`

- [ ] Criar `src/lib/bellu-import.ts`:

```typescript
// src/lib/bellu-import.ts
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchGoogleCalendarEvents, type GCalEvent } from '@/lib/google-calendar-api'

const ImportResultSchema = z.object({
  bookings: z.array(z.object({
    clientName: z.string(),
    procedureTitle: z.string(),
    startTime: z.string(), // ISO 8601
    endTime: z.string(),   // ISO 8601
    googleEventId: z.string(),
  })),
  personalEvents: z.array(z.object({
    googleEventId: z.string(),
    title: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })),
})

export type ImportSummary = {
  clientsCreated: number
  proceduresCreated: number
  bookingsCreated: number
  personalEventsSaved: number
  pendingClients: string[]      // clientes sem telefone
  pendingProcedures: string[]   // procedimentos sem duração/preço
  unrecognizedEvents: string[]  // eventos não parseáveis
}

export async function runInitialImport(userId: string): Promise<ImportSummary> {
  const supabase = await createSupabaseServerClient()

  // Janela: 2 semanas atrás até 1 ano à frente
  const timeMin = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

  const events = await fetchGoogleCalendarEvents({ timeMin, timeMax })
  if (events.length === 0) {
    return {
      clientsCreated: 0, proceduresCreated: 0, bookingsCreated: 0,
      personalEventsSaved: 0, pendingClients: [], pendingProcedures: [], unrecognizedEvents: [],
    }
  }

  // Buscar procedimentos já cadastrados para contexto
  const { data: existingProcedures } = await supabase
    .from('procedures')
    .select('id, name, google_calendar_title')

  const proceduresList = (existingProcedures ?? [])
    .map(p => `- "${p.google_calendar_title ?? p.name}"`)
    .join('\n')

  // Serializar eventos para o modelo
  const eventsText = events
    .map(e => {
      const start = e.start.dateTime ?? e.start.date ?? ''
      const end = e.end.dateTime ?? e.end.date ?? ''
      return `ID:${e.id} | Título:"${e.summary ?? ''}" | Início:${start} | Fim:${end}`
    })
    .join('\n')

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-6'),
    schema: ImportResultSchema,
    prompt: `Você é um assistente analisando o Google Calendar de uma nail designer chamada Bellu.

Procedimentos cadastrados no sistema:
${proceduresList || '(nenhum ainda)'}

Eventos do Google Calendar:
${eventsText}

Sua tarefa:
1. Identifique quais eventos são AGENDAMENTOS de clientes (têm nome de cliente + procedimento de nail/unhas/beleza)
2. Para cada agendamento: extraia clientName, procedureTitle, startTime (ISO 8601), endTime (ISO 8601), googleEventId
3. Eventos que NÃO são agendamentos (médico, reunião, pessoal, etc): coloque em personalEvents
4. Se não conseguir identificar claramente se é agendamento ou pessoal: coloque em personalEvents

Retorne o JSON estruturado conforme o schema.`,
  })

  // Processar resultado
  const summary: ImportSummary = {
    clientsCreated: 0, proceduresCreated: 0, bookingsCreated: 0,
    personalEventsSaved: 0, pendingClients: [], pendingProcedures: [], unrecognizedEvents: [],
  }

  // Salvar eventos pessoais
  for (const ev of object.personalEvents) {
    await supabase.from('google_calendar_events').upsert({
      user_id: userId,
      google_event_id: ev.googleEventId,
      title: ev.title,
      start_time: ev.startTime,
      end_time: ev.endTime,
      is_personal: true,
    }, { onConflict: 'user_id,google_event_id' })
    summary.personalEventsSaved++
  }

  // Processar bookings
  for (const bk of object.bookings) {
    // Buscar ou criar cliente
    let { data: client } = await supabase
      .from('clients')
      .select('id, phone')
      .ilike('name', bk.clientName.trim())
      .maybeSingle()

    if (!client) {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({ name: bk.clientName.trim() })
        .select('id, phone')
        .single()
      client = newClient
      summary.clientsCreated++
      if (!client?.phone) summary.pendingClients.push(bk.clientName)
    } else if (!client.phone) {
      if (!summary.pendingClients.includes(bk.clientName)) {
        summary.pendingClients.push(bk.clientName)
      }
    }

    if (!client) continue

    // Buscar ou criar procedimento
    let { data: procedure } = await supabase
      .from('procedures')
      .select('id, duration, price')
      .or(`name.ilike.%${bk.procedureTitle.trim()}%,google_calendar_title.ilike.%${bk.procedureTitle.trim()}%`)
      .maybeSingle()

    if (!procedure) {
      const { data: newProc } = await supabase
        .from('procedures')
        .insert({
          name: bk.procedureTitle.trim(),
          google_calendar_title: bk.procedureTitle.trim(),
          duration: 60, // default — profissional deve atualizar
          price: 0,
          active: true,
        })
        .select('id, duration, price')
        .single()
      procedure = newProc
      summary.proceduresCreated++
      summary.pendingProcedures.push(bk.procedureTitle)
    }

    if (!procedure) continue

    // Criar booking
    const { error } = await supabase.from('bookings').insert({
      client_id: client.id,
      procedure_id: procedure.id,
      start_time: bk.startTime,
      end_time: bk.endTime,
      status: 'confirmed',
      notes: 'Importado do Google Calendar',
    })

    if (!error) summary.bookingsCreated++

    // Salvar também em google_calendar_events (is_personal: false)
    await supabase.from('google_calendar_events').upsert({
      user_id: userId,
      google_event_id: bk.googleEventId,
      title: `${bk.clientName} — ${bk.procedureTitle}`,
      start_time: bk.startTime,
      end_time: bk.endTime,
      is_personal: false,
    }, { onConflict: 'user_id,google_event_id' })
  }

  return summary
}
```

- [ ] Commit:
```bash
git add src/lib/bellu-import.ts
git commit -m "feat: add bellu intelligent batch import from google calendar"
```

---

### Task 4: Criar endpoint de importação

**Files:**
- Create: `src/app/api/google-calendar/import/route.ts`

- [ ] Criar `src/app/api/google-calendar/import/route.ts`:

```typescript
// src/app/api/google-calendar/import/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { runInitialImport } from '@/lib/bellu-import'

export async function POST(request: Request) {
  // Aceita chamada autenticada (do callback OAuth) ou de usuário logado
  const secret = request.headers.get('x-import-secret')
  const isInternalCall = secret === process.env.CRON_SECRET

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isInternalCall) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (!user) {
    return new NextResponse('No authenticated user for import', { status: 400 })
  }

  // Rodar em background — responde imediatamente para não travar o client
  const userId = user.id

  // Fire and forget — não awaitar para responder 202 rapidamente
  runInitialImport(userId)
    .then(async (summary) => {
      // Salvar resumo para Bellu exibir no chat
      await supabase.from('studio_profile').update({
        pending_import_summary: JSON.stringify(summary),
      }).eq('id', userId)
    })
    .catch(console.error)

  return NextResponse.json({ status: 'importing' }, { status: 202 })
}
```

> ⚠️ `pending_import_summary` requer coluna nova em `studio_profile`. Ver Task 4b abaixo.

- [ ] **Task 4b** — Adicionar coluna via MCP Supabase:

```sql
alter table studio_profile
  add column if not exists pending_import_summary text;
```

- [ ] Commit:
```bash
git add src/app/api/google-calendar/import/
git commit -m "feat: add google calendar import endpoint (async, fire-and-forget)"
```

---

### Task 5: Sync indicator UI

**Files:**
- Create: `src/store/syncStore.ts`
- Create: `src/components/sync/SyncIndicator.tsx`
- Modify: `src/app/dashboard/layout.tsx`

- [ ] Criar `src/store/syncStore.ts`:

```typescript
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
```

- [ ] Criar `src/components/sync/SyncIndicator.tsx`:

```tsx
// src/components/sync/SyncIndicator.tsx
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
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 bg-white border border-stone-200 rounded-full px-3 py-1.5 shadow-md text-xs text-stone-600"
        >
          <Loader2 className="h-3 w-3 animate-spin text-rose-500" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] Em `src/app/dashboard/layout.tsx`, adicionar `<SyncIndicator />` antes do fechamento do root:

```tsx
import { SyncIndicator } from '@/components/sync/SyncIndicator'
// ...dentro do JSX, antes de </body> ou do elemento raiz:
<SyncIndicator />
```

- [ ] Commit:
```bash
git add src/store/syncStore.ts src/components/sync/ src/app/dashboard/layout.tsx
git commit -m "feat: add sync indicator component for google calendar import"
```

---

### Task 6: Acionar sync indicator após OAuth + checar pending summary

**Files:**
- Modify: `src/components/settings/GcalToast.tsx`
- Modify: `src/components/bellu/BelluWidget.tsx`

- [ ] Em `GcalToast.tsx`, ao detectar `gcal=connected`, acionar o sync store:

```tsx
// GcalToast.tsx — atualizado
'use client'
import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSyncStore } from '@/store/syncStore'

export function GcalToast() {
  const params = useSearchParams()
  const router = useRouter()
  const setSync = useSyncStore((s) => s.setSync)

  useEffect(() => {
    const gcal = params.get('gcal')
    if (gcal === 'connected') {
      setSync(true)
      toast.success('Google Calendar conectado! Bellu está analisando sua agenda...')
      // Polling simples: verifica pending_import_summary a cada 3s
      const interval = setInterval(async () => {
        const res = await fetch('/api/google-calendar/import-status')
        if (res.ok) {
          const { done } = await res.json()
          if (done) {
            setSync(false)
            clearInterval(interval)
            router.refresh()
          }
        }
      }, 3000)
      return () => clearInterval(interval)
    }
    if (gcal === 'error') toast.error('Erro ao conectar Google Calendar.')
  }, [params, setSync, router])

  return null
}
```

- [ ] Criar endpoint de status `/api/google-calendar/import-status/route.ts`:

```typescript
// src/app/api/google-calendar/import-status/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data } = await supabase
    .from('studio_profile')
    .select('pending_import_summary')
    .eq('id', user.id)
    .single()

  const done = !!data?.pending_import_summary
  return NextResponse.json({ done, summary: data?.pending_import_summary ?? null })
}
```

- [ ] Em `BelluWidget.tsx`: ao inicializar, verificar `pending_import_summary` e se houver, exibir mensagem de boas-vindas com resumo da importação, depois limpar o campo:

```tsx
// Dentro de BelluWidget — useEffect ao montar:
useEffect(() => {
  fetch('/api/google-calendar/import-status')
    .then(r => r.json())
    .then(({ done, summary }) => {
      if (done && summary) {
        const s = JSON.parse(summary)
        const msg = `Analisei seu Google Calendar! 🎉\n\n` +
          `✅ ${s.bookingsCreated} agendamentos importados\n` +
          `👤 ${s.clientsCreated} clientes criados\n` +
          `💅 ${s.proceduresCreated} serviços criados\n` +
          (s.pendingProcedures.length ? `\n⚠️ Serviços sem duração/preço — acesse **Serviços** para completar:\n${s.pendingProcedures.map((p: string) => `- ${p}`).join('\n')}` : '') +
          (s.pendingClients.length ? `\n📱 Clientes sem telefone (necessário para confirmações WhatsApp):\n${s.pendingClients.map((c: string) => `- ${c}`).join('\n')}` : '')
        // Adicionar como primeira mensagem do Bellu no chat
        addSystemMessage(msg)
        // Limpar pending
        fetch('/api/google-calendar/import-status/clear', { method: 'POST' })
      }
    })
}, [])
```

> Nota: `addSystemMessage` depende da implementação do BelluWidget — adaptar conforme estado do chat.

- [ ] Criar endpoint de clear:

```typescript
// src/app/api/google-calendar/import-status/clear/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  await supabase.from('studio_profile').update({ pending_import_summary: null }).eq('id', user.id)
  return NextResponse.json({ ok: true })
}
```

- [ ] Commit:
```bash
git add src/components/settings/GcalToast.tsx src/components/bellu/ src/app/api/google-calendar/import-status/
git commit -m "feat: poll import status and show bellu welcome message with import summary"
```
