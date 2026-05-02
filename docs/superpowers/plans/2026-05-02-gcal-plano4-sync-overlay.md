# Plano 4 — Write booking→GCal + Webhook + WeekView Overlay

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Espelhar bookings no Google Calendar em tempo real, receber mudanças externas via webhook, exibir eventos pessoais como overlay cinza no WeekView, e atualizar contexto do Bellu IA com eventos do Google.

**Architecture:** Hooks `useBookings` chamam endpoints de escrita que fazem upsert no GCal. Webhook handler salva mudanças em `google_calendar_events`. WeekView lê `google_calendar_events` e renderiza overlay. Bellu context inclui eventos pessoais do dia consultado.

**Tech Stack:** Next.js 15, Google Calendar API, Supabase, AI SDK

**Responsável:** Codex (Tasks 1-3) + Claude (Tasks 4-5)

> ⚠️ Depende dos Planos 2 e 3 estarem implementados.

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/hooks/useBookings.ts` | Modificar | Chamar write GCal após create/update/cancel |
| `src/app/api/google-calendar/webhook/route.ts` | Modificar | Handler real (substituir stub) |
| `src/app/api/cron/gcal-webhook-renew/route.ts` | Criar | Renovar webhook a cada 7 dias |
| `src/hooks/useGoogleCalendarEvents.ts` | Criar | Query eventos pessoais do banco |
| `src/components/calendar/week-view.tsx` | Modificar | Overlay de eventos pessoais |
| `src/lib/bellu-context.ts` | Modificar | Incluir eventos pessoais do Google no system prompt |
| `vercel.json` | Modificar | Adicionar cron de renovação de webhook |

---

### Task 1: Write booking → Google Calendar (Codex)

**Files:**
- Modify: `src/app/api/bookings/route.ts` (ou onde bookings são criados/editados/cancelados)

> Antes de implementar: verificar onde exatamente os bookings são criados (BookingSheet → API route). Adaptar conforme padrão existente.

- [ ] Após salvar booking com sucesso no Supabase, chamar `createGCalEvent` de `@/lib/google-calendar-api`:

```typescript
// Após insert/update de booking bem-sucedido:
import { createGCalEvent, updateGCalEvent, deleteGCalEvent } from '@/lib/google-calendar-api'

// Na criação:
const gcalEventId = await createGCalEvent({
  summary: `Atendimento: ${clientName} — ${procedureName}`,
  start: booking.start_time,
  end: booking.end_time,
})

// Salvar gcalEventId no booking se tiver coluna (opcional — ver abaixo)
```

- [ ] Adicionar coluna `google_calendar_event_id` em `bookings` via MCP Supabase:

```sql
alter table bookings
  add column if not exists google_calendar_event_id text;
```

- [ ] Na edição de booking: chamar `updateGCalEvent` com o `google_calendar_event_id` salvo
- [ ] No cancelamento: chamar `deleteGCalEvent`
- [ ] Ignorar erros do GCal silenciosamente (GCal é espelho, não bloqueia operação)
- [ ] Commit:
```bash
git add src/app/api/bookings/ src/hooks/useBookings.ts
git commit -m "feat: mirror bookings to google calendar on create/update/cancel"
```

---

### Task 2: Webhook handler real (Codex)

**Files:**
- Modify: `src/app/api/google-calendar/webhook/route.ts`

- [ ] Substituir stub pelo handler real que salva em `google_calendar_events`:

```typescript
// src/app/api/google-calendar/webhook/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchGoogleCalendarEvents } from '@/lib/google-calendar-api'

export async function POST(request: Request) {
  // Google envia headers, não body com eventos
  const resourceState = request.headers.get('x-goog-resource-state')
  if (resourceState === 'sync') {
    // Primeiro ping do Google ao registrar webhook — ignorar
    return new NextResponse(null, { status: 200 })
  }

  const supabase = await createSupabaseServerClient()

  // Buscar usuário pelo channel registrado
  // Por simplicidade: buscar todos os usuários com google_tokens e resync
  // (sistema single-user — sempre 1 usuário)
  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('user_id')
    .maybeSingle()

  if (!tokenRow) return new NextResponse(null, { status: 200 })

  // Re-fetch eventos das próximas 2 semanas para atualizar
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const events = await fetchGoogleCalendarEvents({ timeMin, timeMax, maxResults: 100 })

  for (const ev of events) {
    if (!ev.start.dateTime) continue // eventos de dia inteiro — ignorar
    await supabase.from('google_calendar_events').upsert({
      user_id: tokenRow.user_id,
      google_event_id: ev.id,
      title: ev.summary ?? 'Sem título',
      start_time: ev.start.dateTime,
      end_time: ev.end.dateTime ?? ev.start.dateTime,
      is_personal: true, // webhook só traz eventos externos
    }, { onConflict: 'user_id,google_event_id' })
  }

  return new NextResponse(null, { status: 200 })
}
```

- [ ] Commit:
```bash
git add src/app/api/google-calendar/webhook/
git commit -m "feat: implement real google calendar webhook handler"
```

---

### Task 3: Hook e overlay WeekView (Codex)

**Files:**
- Create: `src/hooks/useGoogleCalendarEvents.ts`
- Modify: `src/components/calendar/week-view.tsx`

- [ ] Criar `src/hooks/useGoogleCalendarEvents.ts`:

```typescript
// src/hooks/useGoogleCalendarEvents.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { sb } from '@/lib/supabase-browser'

export interface GoogleCalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  is_personal: boolean
}

export function useGoogleCalendarEvents(from: string, to: string) {
  return useQuery<GoogleCalendarEvent[]>({
    queryKey: ['google-calendar-events', from, to],
    queryFn: async () => {
      const { data, error } = await sb
        .from('google_calendar_events')
        .select('id, title, start_time, end_time, is_personal')
        .gte('start_time', from)
        .lte('start_time', to)
        .eq('is_personal', true)
        .order('start_time')
      if (error) return []
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

- [ ] Em `src/components/calendar/week-view.tsx`, na view Dia (DayView), importar e usar o hook para renderizar overlay:

```tsx
// Importar:
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents'

// Dentro do componente, computar range do dia selecionado:
const dayStart = format(selectedDate, 'yyyy-MM-dd') + 'T00:00:00'
const dayEnd = format(selectedDate, 'yyyy-MM-dd') + 'T23:59:59'
const { data: gcalEvents = [] } = useGoogleCalendarEvents(dayStart, dayEnd)

// No render da timeline, após os bookings, adicionar overlay por evento:
{gcalEvents.map((ev) => {
  const start = new Date(ev.start_time)
  const end = new Date(ev.end_time)
  const startMin = start.getHours() * 60 + start.getMinutes()
  const endMin = end.getHours() * 60 + end.getMinutes()
  const top = (startMin - DAY_START * 60) * (HOUR_HEIGHT / 60)
  const height = Math.max((endMin - startMin) * (HOUR_HEIGHT / 60), 20)

  return (
    <div
      key={ev.id}
      className="absolute left-0 right-0 mx-1 rounded bg-stone-200/70 border border-stone-300 px-2 py-1 pointer-events-none"
      style={{ top, height }}
    >
      <p className="text-[10px] text-stone-500 truncate">{ev.title}</p>
    </div>
  )
})}
```

- [ ] Commit:
```bash
git add src/hooks/useGoogleCalendarEvents.ts src/components/calendar/week-view.tsx
git commit -m "feat: show personal google calendar events as overlay in week view"
```

---

### Task 4: Cron renovação de webhook + vercel.json (Codex)

**Files:**
- Create: `src/app/api/cron/gcal-webhook-renew/route.ts`
- Modify: `vercel.json`

- [ ] Criar `src/app/api/cron/gcal-webhook-renew/route.ts`:

```typescript
// src/app/api/cron/gcal-webhook-renew/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { registerGCalWebhook } from '@/lib/google-calendar-api'
import { getValidAccessToken } from '@/lib/google-token'
import { randomUUID } from 'crypto'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const token = await getValidAccessToken()
  if (!token) return NextResponse.json({ skipped: 'no token' })

  const channelId = randomUUID()
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/webhook`

  const result = await registerGCalWebhook({ channelId, callbackUrl })
  if (!result) return NextResponse.json({ error: 'failed to register webhook' }, { status: 500 })

  return NextResponse.json({ ok: true, expiration: result.expiration })
}
```

- [ ] Em `vercel.json`, adicionar cron (mantendo o existente de confirmações):

```json
{
  "crons": [
    {
      "path": "/api/cron/confirmations",
      "schedule": "0 11 * * *"
    },
    {
      "path": "/api/cron/gcal-webhook-renew",
      "schedule": "0 6 * * 1"
    }
  ]
}
```

> `0 6 * * 1` = toda segunda-feira às 06:00 UTC (03:00 BRT) — antes do webhook expirar em 7 dias.

- [ ] Commit:
```bash
git add src/app/api/cron/gcal-webhook-renew/ vercel.json
git commit -m "feat: add cron to renew google calendar webhook weekly"
```

---

### Task 5: Bellu IA ciente de eventos do Google (Claude)

**Files:**
- Modify: `src/lib/bellu-context.ts`
- Modify: `src/lib/bellu-tools.ts`

- [ ] Em `bellu-context.ts`, adicionar busca de eventos pessoais do dia atual:

```typescript
// Adicionar no buildBelluSystemPrompt(), após os procedimentos:

const today = new Date().toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const { data: gcalEvents } = await supabase
  .from('google_calendar_events')
  .select('title, start_time, end_time')
  .gte('start_time', `${today}T00:00:00`)
  .lte('start_time', `${tomorrow}T23:59:59`)
  .eq('is_personal', true)
  .order('start_time')

const gcalEventsList = (gcalEvents ?? [])
  .map(ev => {
    const start = new Date(ev.start_time).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
    })
    const end = new Date(ev.end_time).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
    })
    return `- ${ev.title}: ${start} – ${end}`
  })
  .join('\n')

// Adicionar ao system prompt:
const gcalSection = gcalEventsList
  ? `\nCompromissos pessoais hoje/amanhã (Google Calendar — NÃO são atendimentos):\n${gcalEventsList}\n\nSe algum agendamento conflitar com esses horários, avise a profissional.`
  : ''

// Incluir gcalSection no return do prompt
```

- [ ] Adicionar tool `get_google_events` em `bellu-tools.ts` para Bellu poder consultar eventos de qualquer data:

```typescript
get_google_events: tool({
  description: 'Retorna eventos pessoais do Google Calendar em uma data específica (compromissos não relacionados a atendimentos)',
  inputSchema: zodSchema(z.object({
    date: z.string().describe('Data no formato YYYY-MM-DD'),
  })),
  execute: async ({ date }) => {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('google_calendar_events')
      .select('title, start_time, end_time')
      .gte('start_time', `${date}T00:00:00+00:00`)
      .lte('start_time', `${date}T23:59:59+00:00`)
      .eq('is_personal', true)
      .order('start_time')
    if (error) return { error: error.message }
    return data ?? []
  },
}),
```

- [ ] Commit:
```bash
git add src/lib/bellu-context.ts src/lib/bellu-tools.ts
git commit -m "feat: bellu ia context includes personal google calendar events for conflict detection"
```
