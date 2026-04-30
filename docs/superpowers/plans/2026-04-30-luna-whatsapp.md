# Luna WhatsApp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar confirmação 24h antes via WhatsApp (Baileys) + fluxo bidirecional de cancelamento/reagendamento com autorização da profissional.

**Architecture:** Cron Vercel dispara a cada hora entre 08-18. Baileys envia mensagens. Webhook recebe respostas e executa state machine por conversa (`whatsapp_conversations`). Profissional autoriza ações via WhatsApp.

**Tech Stack:** Next.js 15 App Router, Baileys (`@whiskeysockets/baileys`), Supabase, Vercel Cron, TypeScript strict

**Pré-requisito:** Plan A (luna-dashboard) concluído. Schema de `bookings.whatsapp_confirmed_at` aplicado neste plano.

---

## File Map

| Ação | Arquivo |
|---|---|
| Modify | `src/lib/baileys.ts` |
| Create | `src/lib/whatsapp-state-machine.ts` |
| Create | `src/app/api/cron/whatsapp-confirmations/route.ts` |
| Modify | `src/app/api/whatsapp/webhook/route.ts` (ou criar) |
| Create/Modify | `vercel.json` |

---

## Task 1: Supabase migrations — bookings + whatsapp_conversations

**Files:** Supabase (via MCP)

- [ ] **Step 1: Aplicar via MCP — bookings.whatsapp_confirmed_at**

```sql
ALTER TABLE bookings
ADD COLUMN whatsapp_confirmed_at timestamptz;
```

Usar `mcp__claude_ai_Supabase__apply_migration` com project_id `xibcbjyhtvzlkgjbywru`.

- [ ] **Step 2: Aplicar via MCP — tabela whatsapp_conversations**

```sql
CREATE TABLE whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone text NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  state text NOT NULL CHECK (state IN (
    'awaiting_client_reply',
    'awaiting_professional_auth',
    'resolved',
    'expired'
  )),
  intent text CHECK (intent IN ('cancel', 'reschedule')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- RLS
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users full access"
  ON whatsapp_conversations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

- [ ] **Step 3: Verificar**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'whatsapp_confirmed_at';

SELECT table_name FROM information_schema.tables
WHERE table_name = 'whatsapp_conversations';
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(db): add whatsapp_confirmed_at + whatsapp_conversations table"
```

---

## Task 2: Install Baileys

**Files:** `package.json`

- [ ] **Step 1: Instalar Baileys**

```bash
npm install @whiskeysockets/baileys
```

- [ ] **Step 2: Verificar instalação**

```bash
npm ls @whiskeysockets/baileys
```

- [ ] **Step 3: Adicionar variável de ambiente**

Em `.env.local`:
```
WHATSAPP_SESSION_PATH=./whatsapp-session
PROFESSIONAL_PHONE=5512999999999
```

`PROFESSIONAL_PHONE` = número da profissional com DDI+DDD sem `+` (ex: `5512991234567`).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @whiskeysockets/baileys"
```

---

## Task 3: Rewrite baileys.ts — implementação real

**Files:**
- Modify: `src/lib/baileys.ts`

> **Importante:** Baileys mantém sessão em disco. Em Vercel (serverless), a sessão não persiste entre invocações. Para produção, a sessão deve ser armazenada no Supabase Storage ou num servidor dedicado. Este plano implementa a estrutura correta; a persistência de sessão em storage pode ser adicionada depois.

- [ ] **Step 1: Reescrever baileys.ts**

```typescript
// src/lib/baileys.ts
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys'
import type { WASocket } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import path from 'path'
import { z } from 'zod'
import type { WhatsAppSession } from '@/types'

export const whatsappMessageSchema = z.object({
  phone: z.string().min(8, 'Telefone inválido.'),
  message: z.string().min(1, 'Mensagem obrigatória.'),
})

export type WhatsAppMessageInput = z.infer<typeof whatsappMessageSchema>

const SESSION_PATH = process.env.WHATSAPP_SESSION_PATH ?? './whatsapp-session'

let socketInstance: WASocket | null = null

async function getSocket(): Promise<WASocket> {
  if (socketInstance) return socketInstance

  const authPath = path.resolve(SESSION_PATH)
  const { state, saveCreds } = await useMultiFileAuthState(authPath)

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ['Luna Ayumi', 'Chrome', '1.0.0'],
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) {
        socketInstance = null
      }
    }
  })

  socketInstance = sock
  return sock
}

export async function createWhatsAppSession(): Promise<WhatsAppSession> {
  return {
    id: 'default',
    status: 'disconnected',
    qrCode: null,
    phone: null,
    sessionPath: SESSION_PATH,
    updatedAt: new Date(0).toISOString(),
  }
}

export async function getWhatsAppSession(): Promise<WhatsAppSession> {
  return createWhatsAppSession()
}

export async function sendWhatsAppMessage(
  input: WhatsAppMessageInput,
): Promise<{ queued: boolean; error?: string }> {
  const parsed = whatsappMessageSchema.parse(input)

  try {
    const sock = await getSocket()
    // Formato Baileys: número@s.whatsapp.net
    const jid = `${parsed.phone}@s.whatsapp.net`
    await sock.sendMessage(jid, { text: parsed.message })
    return { queued: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[Baileys] Erro ao enviar mensagem:', message)
    return { queued: false, error: message }
  }
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | head -50
```

Se houver erros de tipo com Baileys, adicionar `@types/node` (já instalado) e verificar se o import do Baileys está correto.

- [ ] **Step 3: Commit**

```bash
git add src/lib/baileys.ts
git commit -m "feat: implement sendWhatsAppMessage with Baileys"
```

---

## Task 4: Create whatsapp-state-machine.ts

**Files:**
- Create: `src/lib/whatsapp-state-machine.ts`

- [ ] **Step 1: Criar state machine**

```typescript
// src/lib/whatsapp-state-machine.ts
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sendWhatsAppMessage } from '@/lib/baileys'

const PROFESSIONAL_PHONE = process.env.PROFESSIONAL_PHONE ?? ''
const TIMEOUT_MS = 2 * 60 * 60 * 1000 // 2 horas

type ConversationState =
  | 'awaiting_client_reply'
  | 'awaiting_professional_auth'
  | 'resolved'
  | 'expired'

type Intent = 'cancel' | 'reschedule'

type Conversation = {
  id: string
  phone: string
  booking_id: string
  state: ConversationState
  intent: Intent | null
  expires_at: string
}

/** Cria conversa aguardando resposta da cliente */
export async function createConfirmationConversation(bookingId: string, clientPhone: string) {
  const supabase = await createSupabaseServerClient()
  const expiresAt = new Date(Date.now() + TIMEOUT_MS).toISOString()
  await supabase.from('whatsapp_conversations').insert({
    phone: clientPhone,
    booking_id: bookingId,
    state: 'awaiting_client_reply' as ConversationState,
    intent: null,
    expires_at: expiresAt,
  })
}

/** Processa resposta da cliente */
export async function handleClientMessage(phone: string, text: string) {
  const supabase = await createSupabaseServerClient()
  const normalized = text.trim().toUpperCase()

  const { data: conv } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('phone', phone)
    .eq('state', 'awaiting_client_reply')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!conv) return // sem conversa ativa

  if (normalized === 'SIM') {
    await supabase
      .from('bookings')
      .update({ whatsapp_confirmed_at: new Date().toISOString() })
      .eq('id', conv.booking_id)
    await supabase
      .from('whatsapp_conversations')
      .update({ state: 'resolved' as ConversationState })
      .eq('id', conv.id)
    return
  }

  const isCancelRequest =
    normalized.includes('CANCELAR') || normalized.includes('CANCEL')
  const isRescheduleRequest =
    normalized.includes('REAGENDAR') || normalized.includes('REMARCAR')

  if (!isCancelRequest && !isRescheduleRequest) return

  const intent: Intent = isCancelRequest ? 'cancel' : 'reschedule'

  // Buscar dados do agendamento
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, start_time, clients(name, phone), procedures(name, duration)')
    .eq('id', conv.booking_id)
    .single()

  if (!booking) return

  const clientName = (booking.clients as { name: string } | null)?.name ?? 'Cliente'
  const procedureName = (booking.procedures as { name: string } | null)?.name ?? 'Procedimento'
  const startTime = new Date(booking.start_time).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  })

  // Buscar próximos 3 slots disponíveis (próximos 3 dias úteis)
  const slotsText = await getNextAvailableSlotsSummary(supabase, conv.booking_id)

  // Avisar cliente
  await sendWhatsAppMessage({
    phone,
    message: `Entendido! Aguarde um momento, vou confirmar com a profissional. 🌸`,
  })

  // Avisar profissional
  const actionLabel = intent === 'cancel' ? 'CANCELAR' : 'REAGENDAR'
  await sendWhatsAppMessage({
    phone: PROFESSIONAL_PHONE,
    message: `⚠️ *${clientName}* quer ${actionLabel.toLowerCase()} o agendamento.

📋 Procedimento: ${procedureName}
📅 Horário atual: ${startTime}
📱 Contato: +${phone}
${slotsText}

Responda *AUTORIZAR* ou *RECUSAR* para eu continuar, ou entre em contato com a cliente diretamente.`,
  })

  // Atualizar conversa
  const newExpiresAt = new Date(Date.now() + TIMEOUT_MS).toISOString()
  await supabase
    .from('whatsapp_conversations')
    .update({
      state: 'awaiting_professional_auth' as ConversationState,
      intent,
      expires_at: newExpiresAt,
    })
    .eq('id', conv.id)
}

/** Processa resposta da profissional */
export async function handleProfessionalMessage(text: string) {
  const supabase = await createSupabaseServerClient()
  const normalized = text.trim().toUpperCase()

  if (!normalized.includes('AUTORIZAR') && !normalized.includes('RECUSAR')) return

  const { data: conv } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('state', 'awaiting_professional_auth')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!conv) return

  const { data: booking } = await supabase
    .from('bookings')
    .select('start_time, clients(name, phone), procedures(name)')
    .eq('id', conv.booking_id)
    .single()

  const clientPhone = (booking?.clients as { phone: string } | null)?.phone ?? conv.phone
  const clientName = (booking?.clients as { name: string } | null)?.name ?? 'Cliente'
  const studioName = process.env.STUDIO_NAME ?? 'o estúdio'

  if (normalized.includes('AUTORIZAR')) {
    if (conv.intent === 'cancel') {
      await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', conv.booking_id)

      await sendWhatsAppMessage({
        phone: clientPhone,
        message: `Olá ${clientName}! Seu agendamento foi cancelado conforme solicitado. Se quiser remarcar, é só entrar em contato. 🌸`,
      })
    } else {
      // reagendamento: avisar cliente para escolher novo horário
      const slotsText = await getNextAvailableSlotsSummary(supabase, conv.booking_id)
      await sendWhatsAppMessage({
        phone: clientPhone,
        message: `Olá ${clientName}! Podemos reagendar. Aqui estão os próximos horários disponíveis:\n\n${slotsText}\n\nResponda com o horário de preferência. 🌸`,
      })
    }
  } else {
    // RECUSAR
    await sendWhatsAppMessage({
      phone: clientPhone,
      message: `Olá ${clientName}! ${studioName} vai entrar em contato com você em breve para resolver seu agendamento. 🌸`,
    })
  }

  await supabase
    .from('whatsapp_conversations')
    .update({ state: 'resolved' as ConversationState })
    .eq('id', conv.id)
}

/** Expira conversas com timeout atingido e notifica cliente */
export async function expireTimedOutConversations() {
  const supabase = await createSupabaseServerClient()
  const studioName = process.env.STUDIO_NAME ?? 'o estúdio'

  const { data: expired } = await supabase
    .from('whatsapp_conversations')
    .select('id, phone, state')
    .in('state', ['awaiting_client_reply', 'awaiting_professional_auth'])
    .lt('expires_at', new Date().toISOString())

  for (const conv of expired ?? []) {
    if (conv.state === 'awaiting_professional_auth') {
      await sendWhatsAppMessage({
        phone: conv.phone,
        message: `Olá! ${studioName} vai entrar em contato com você em breve para resolver seu agendamento. 🌸`,
      })
    }
    await supabase
      .from('whatsapp_conversations')
      .update({ state: 'expired' as ConversationState })
      .eq('id', conv.id)
  }
}

/** Retorna resumo dos próximos slots disponíveis (helper interno) */
async function getNextAvailableSlotsSummary(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  bookingId: string,
): Promise<string> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('procedure_id')
    .eq('id', bookingId)
    .single()

  if (!booking) return 'Consultar disponibilidade diretamente.'

  const lines: string[] = []
  const today = new Date()

  for (let i = 1; i <= 5 && lines.length < 3; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayOfWeek = d.getDay()

    const { data: wh } = await supabase
      .from('working_hours')
      .select('start_time, end_time, active')
      .eq('day_of_week', dayOfWeek)
      .single()

    if (!wh || !wh.active) continue

    const { data: proc } = await supabase
      .from('procedures')
      .select('duration')
      .eq('id', booking.procedure_id)
      .single()

    if (!proc) continue

    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .gte('start_time', `${dateStr}T00:00:00`)
      .lte('start_time', `${dateStr}T23:59:59`)
      .neq('status', 'cancelled')

    const [sh, sm] = wh.start_time.split(':').map(Number)
    const [eh, em] = wh.end_time.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em
    const BUFFER = 30
    const daySlots: string[] = []

    for (let t = startMin; t + proc.duration + BUFFER <= endMin; t += 30) {
      const hh = String(Math.floor(t / 60)).padStart(2, '0')
      const mm = String(t % 60).padStart(2, '0')
      const slotMs = new Date(`${dateStr}T${hh}:${mm}:00`).getTime()
      const slotEndMs = slotMs + (proc.duration + BUFFER) * 60_000
      const conflict = (bookings ?? []).some((b) => {
        const bs = new Date(b.start_time).getTime() - BUFFER * 60_000
        const be = new Date(b.end_time).getTime() + BUFFER * 60_000
        return slotMs < be && slotEndMs > bs
      })
      if (!conflict && daySlots.length < 2) daySlots.push(`${hh}:${mm}`)
    }

    if (daySlots.length > 0) {
      const label = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
      lines.push(`📅 ${label}: ${daySlots.join(', ')}`)
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'Sem horários disponíveis nos próximos dias.'
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | head -50
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/whatsapp-state-machine.ts
git commit -m "feat: add WhatsApp state machine (confirm/cancel/reschedule flow)"
```

---

## Task 5: Create cron route — /api/cron/whatsapp-confirmations

**Files:**
- Create: `src/app/api/cron/whatsapp-confirmations/route.ts`

- [ ] **Step 1: Criar a rota**

```typescript
// src/app/api/cron/whatsapp-confirmations/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sendWhatsAppMessage } from '@/lib/baileys'
import { createConfirmationConversation, expireTimedOutConversations } from '@/lib/whatsapp-state-machine'

export async function GET(request: Request) {
  // Validar CRON_SECRET (Vercel injeta automaticamente)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Verificar horário comercial (08:00–18:00 horário de Brasília)
  const nowBrasilia = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  const hour = new Date(nowBrasilia).getHours()
  if (hour < 8 || hour >= 18) {
    return NextResponse.json({ skipped: 'fora do horário comercial' })
  }

  // Expirar conversas com timeout
  await expireTimedOutConversations()

  const supabase = await createSupabaseServerClient()

  // Amanhã no formato YYYY-MM-DD
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, start_time, clients(name, phone), procedures(name, duration)')
    .gte('start_time', `${tomorrowStr}T00:00:00+00:00`)
    .lte('start_time', `${tomorrowStr}T23:59:59+00:00`)
    .neq('status', 'cancelled')
    .is('whatsapp_confirmed_at', null)

  if (error) {
    console.error('[Cron] Erro ao buscar bookings:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: profile } = await supabase
    .from('studio_profile')
    .select('studio_name, owner_name')
    .single()

  const studioName = profile?.studio_name ?? 'o estúdio'
  const results: Array<{ bookingId: string; status: string }> = []

  for (const booking of bookings ?? []) {
    const client = booking.clients as { name: string; phone: string } | null
    const procedure = booking.procedures as { name: string; duration: number } | null

    if (!client?.phone) {
      results.push({ bookingId: booking.id, status: 'sem telefone' })
      continue
    }

    const hora = new Date(booking.start_time).toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    })

    const message = `Olá ${client.name}! 🌸
Lembrando seu agendamento *amanhã às ${hora}* com ${studioName}.
📋 Procedimento: ${procedure?.name ?? 'Serviço'} (${procedure?.duration ?? 0} min)

Responda *SIM* para confirmar ou *CANCELAR* / *REAGENDAR* se precisar.`

    const { queued, error: sendError } = await sendWhatsAppMessage({
      phone: client.phone,
      message,
    })

    if (sendError) {
      results.push({ bookingId: booking.id, status: `erro: ${sendError}` })
      continue
    }

    if (queued) {
      await createConfirmationConversation(booking.id, client.phone)
    }

    results.push({ bookingId: booking.id, status: queued ? 'enviado' : 'falhou' })
  }

  return NextResponse.json({ processed: results.length, results })
}
```

- [ ] **Step 2: Build check + commit**

```bash
npm run build 2>&1 | head -40
git add src/app/api/cron/whatsapp-confirmations/route.ts
git commit -m "feat: add cron route for WhatsApp 24h confirmations"
```

---

## Task 6: Update webhook route

**Files:**
- Modify: `src/app/api/whatsapp/webhook/route.ts`

- [ ] **Step 1: Verificar arquivo existente**

```bash
ls src/app/api/whatsapp/
```

- [ ] **Step 2: Criar/substituir `src/app/api/whatsapp/webhook/route.ts`**

```typescript
// src/app/api/whatsapp/webhook/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { handleClientMessage, handleProfessionalMessage } from '@/lib/whatsapp-state-machine'

const webhookSchema = z.object({
  phone: z.string(),
  message: z.string(),
})

const PROFESSIONAL_PHONE = process.env.PROFESSIONAL_PHONE ?? ''

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const parsed = webhookSchema.safeParse(body)
  if (!parsed.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { phone, message } = parsed.data

  try {
    if (phone === PROFESSIONAL_PHONE) {
      await handleProfessionalMessage(message)
    } else {
      await handleClientMessage(phone, message)
    }
  } catch (err) {
    console.error('[Webhook] Erro:', err)
    // Não retornar 500 — Baileys pode tentar reenviar
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Build check + commit**

```bash
npm run build 2>&1 | head -40
git add src/app/api/whatsapp/
git commit -m "feat: update WhatsApp webhook — route client/professional messages to state machine"
```

---

## Task 7: Configure Vercel Cron

**Files:**
- Create/Modify: `vercel.json`

- [ ] **Step 1: Verificar se vercel.json existe**

```bash
ls vercel.json 2>/dev/null && echo "existe" || echo "não existe"
```

- [ ] **Step 2: Criar/atualizar vercel.json**

Se não existir:
```json
{
  "crons": [
    {
      "path": "/api/cron/whatsapp-confirmations",
      "schedule": "0 8-18 * * *"
    }
  ]
}
```

Se já existir, adicionar o objeto `crons` ao JSON existente (preservar outras configurações).

- [ ] **Step 3: Adicionar CRON_SECRET ao .env.local**

```bash
grep CRON_SECRET .env.local || echo "CRON_SECRET=<gerar-valor-aleatório>"
```

Gerar valor:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Adicionar ao `.env.local`:
```
CRON_SECRET=<valor-gerado>
```

Adicionar também às variáveis de ambiente no Vercel Dashboard.

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel cron for WhatsApp confirmations (0 8-18 * * *)"
```

---

## Task 8: Add STUDIO_NAME env + docs

**Files:** `.env.local`, `README.md` (opcional)

- [ ] **Step 1: Adicionar variável**

Em `.env.local`:
```
STUDIO_NAME=Ayumi Nails
```

- [ ] **Step 2: Final build check**

```bash
npm run build
```

Esperado: `✓ Compiled successfully`

- [ ] **Step 3: Commit final**

```bash
git add .env.local
git commit -m "chore: add STUDIO_NAME env var"
```

---

## Task 9: Configurar Baileys localmente (QR Code)

> Esta task é operacional, não de código. Deve ser executada no servidor/máquina onde o app roda.

- [ ] **Step 1: Rodar dev server**

```bash
npm run dev
```

- [ ] **Step 2: Fazer primeira requisição para inicializar Baileys**

```bash
curl -X GET http://localhost:3000/api/cron/whatsapp-confirmations \
  -H "Authorization: Bearer <CRON_SECRET>"
```

- [ ] **Step 3: Escanear QR Code**

O terminal vai exibir um QR Code ASCII. Abrir WhatsApp no celular da profissional → Dispositivos vinculados → Vincular dispositivo → Escanear QR Code.

- [ ] **Step 4: Verificar sessão salva**

```bash
ls ./whatsapp-session/
```

Esperado: arquivos de sessão criados (`creds.json`, etc).

- [ ] **Step 5: Testar envio manual**

```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"phone":"5512999999999","message":"Teste de webhook"}'
```

---

## Checklist final

- [ ] `bookings.whatsapp_confirmed_at` coluna existe no banco
- [ ] Tabela `whatsapp_conversations` existe com RLS
- [ ] Baileys instalado e `sendWhatsAppMessage` não retorna erro de tipo
- [ ] Cron `/api/cron/whatsapp-confirmations` retorna 200
- [ ] Webhook `/api/whatsapp/webhook` aceita POST
- [ ] `vercel.json` tem cron configurado
- [ ] `CRON_SECRET`, `PROFESSIONAL_PHONE`, `STUDIO_NAME` em `.env.local`
- [ ] Build limpo: `npm run build`

---

## Notas de produção

1. **Sessão Baileys em Vercel:** Vercel é serverless — o socket não persiste entre invocações. Para produção real, mover o Baileys para um servidor Node.js dedicado (Railway, Fly.io, VPS) e expor endpoint HTTP que o app Next.js chama.

2. **PROFESSIONAL_PHONE:** Deve ser o número exato como registrado no WhatsApp, formato `5511999999999` (DDI+DDD+número, sem `+` ou `-`).

3. **Webhook Baileys → Next.js:** O Baileys precisa chamar `POST /api/whatsapp/webhook` quando receber mensagem. Implementar listener `sock.ev.on('messages.upsert', ...)` no `getSocket()` que faz `fetch` interno para o webhook.
