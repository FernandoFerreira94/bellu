# Luna Chatbot IA — Design Spec

**Data:** 2026-04-30
**Projeto:** Ayumi Nails
**Status:** Aprovado

---

## Visão Geral

Luna é assistente pessoal da nail designer no dashboard. Acesso via bottom nav (sheet bottom). Integração Claude via Vercel AI SDK com streaming. WhatsApp bidirecional via Baileys para confirmação 24h + fluxo de cancelamento/reagendamento com autorização da profissional.

---

## 1. Arquitetura

```
Dashboard (LunaSheet)
  └── useChat (Vercel AI SDK / ai/react)
        └── POST /api/luna  (streaming, claude-sonnet-4-6)
              ├── System prompt: data atual + working_hours + studio_profile + procedures ativos
              ├── Tool: get_available_slots
              ├── Tool: create_booking
              ├── Tool: cancel_booking
              ├── Tool: get_clients
              ├── Tool: get_bookings
              └── Tool: get_financial_summary

Vercel Cron: "0 8-18 * * *"
  └── GET /api/cron/whatsapp-confirmations
        ├── Busca bookings: date = amanhã + whatsapp_confirmed_at IS NULL
        └── Dispara Baileys por booking

Baileys incoming webhook
  └── POST /api/whatsapp/webhook
        ├── Router: cliente vs profissional (por número)
        └── State machine por conversa (whatsapp_conversations)
```

---

## 2. Dependências Novas

- `ai` — Vercel AI SDK
- `@ai-sdk/anthropic` — provider Anthropic para AI SDK

---

## 3. Schema Changes

### `procedures`
```sql
ALTER TABLE procedures ADD COLUMN luna_enabled boolean NOT NULL DEFAULT true;
```

### `bookings`
```sql
ALTER TABLE bookings ADD COLUMN whatsapp_confirmed_at timestamptz;
```

### Nova tabela: `whatsapp_conversations`
```sql
CREATE TABLE whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
```

RLS: apenas usuário autenticado lê/escreve (profissional).

---

## 4. API Route — `/api/luna/route.ts`

Reescrita completa. POST streaming com Vercel AI SDK.

**Fluxo:**
1. Auth check via `createSupabaseServerClient()` — 401 se não autenticado
2. Carrega contexto: `studio_profile` + `working_hours` da semana + `procedures WHERE luna_enabled = true`
3. Chama `streamText({ model, system, messages, tools })`
4. Retorna `result.toDataStreamResponse()`

**System prompt template:**
```
Você é Luna, assistente pessoal da {studio_profile.name}.
Data e hora atual: {ISO string com timezone America/Sao_Paulo}
Horários de trabalho desta semana:
{JSON working_hours — dia, hora_inicio, hora_fim, ativo}
Serviços disponíveis (Luna pode oferecer):
{lista: nome, duração em minutos, preço}
Regras obrigatórias:
- Buffer mínimo de 30 minutos entre procedimentos.
- Nunca agendar fora do horário de trabalho configurado.
- Confirmar antes de cancelar qualquer agendamento.
- Linguagem informal, como assistente pessoal.
- Respostas curtas; detalhes só se pedido.
```

**Tools (server-side, Supabase direto):**

| Tool | Input | Output |
|---|---|---|
| `get_available_slots` | `date: string, procedure_id: string` | array de slots livres respeitando working_hours + buffer 30min + bookings existentes |
| `create_booking` | `client_id, procedure_id, starts_at` | booking criado |
| `cancel_booking` | `booking_id` | confirmação (requer confirmação prévia no chat) |
| `get_clients` | `search?: string` | lista de clientes |
| `get_bookings` | `from: string, to: string` | agendamentos no período |
| `get_financial_summary` | `from: string, to: string` | total receita, despesas, lucro |

Tool invocations mostram pill discreto na UI: "buscando agenda...", "consultando clientes..." etc.

---

## 5. LunaWidget — Sheet Bottom

**Trigger:** item "Luna" no bottom nav → abre `Sheet side="bottom"` via `lunaUIStore.setSheetOpen(true)`

**Dimensões:** altura `min(32rem, 100vh - 4rem)`

**Header do sheet:**
- Título "✦ Luna"
- Botão reset (ícone `RotateCcw`) — limpa mensagens no store + reinicia `useChat`
- Botão fechar

**Área de mensagens:**
- `ScrollArea` com `flex-col` — auto-scroll para última mensagem
- Mensagem user: alinhada direita, bg `rose-100`, texto `rose-900`
- Mensagem Luna: alinhada esquerda, bg `stone-100`, texto `stone-800`
- Durante tool call: pill `"buscando..."` em `stone-200` com spinner
- Durante streaming: cursor piscando no fim da mensagem

**Chips pré-formados** (visíveis só quando lista vazia):
1. "Horários disponíveis esta semana"
2. "Resumo financeiro da semana"
3. "Quem tenho agendado hoje?"
4. "Quero agendar uma cliente"

Cor dos chips: `rose-500` (primária do projeto). Somem após primeira mensagem.

**Input:**
- `Textarea` com auto-resize (1–4 linhas)
- Submit: botão `Send` ou `Enter` (Shift+Enter = nova linha)
- Desabilitado durante streaming

**Persistência:**
- Histórico salvo em `lunaUIStore` (Zustand) — sobrevive fechar/abrir o sheet
- `useChat` inicializado com `initialMessages` do store
- `onFinish` callback sincroniza mensagens de volta ao store

---

## 6. WhatsApp — Cron de Confirmações

**Rota:** `GET /api/cron/whatsapp-confirmations`
**Schedule:** `"0 8-18 * * *"` (Vercel Cron — toda hora entre 08:00 e 18:00)
**Auth:** header `Authorization: Bearer ${CRON_SECRET}`

**Lógica:**
1. Busca bookings: `date = CURRENT_DATE + 1` + `whatsapp_confirmed_at IS NULL` + `status != 'cancelled'`
2. Para cada booking: monta mensagem + envia via Baileys
3. Atualiza `whatsapp_confirmed_at = now()`
4. Erros por booking são logados individualmente — não interrompem os demais

**Mensagem de confirmação:**
```
Olá {client.name}!
Lembrando seu agendamento amanhã às {hora} com {studio.name}.
Procedimento: {procedure.name} ({duration} min)

Responda SIM para confirmar ou CANCELAR / REAGENDAR se precisar.
```

---

## 7. WhatsApp — Webhook Bidirecional

**Rota:** `POST /api/whatsapp/webhook`
Baileys chama este endpoint ao receber mensagem incoming.

**Router por número:**
- Número = `studio_profile.phone` → handler profissional
- Outro número → busca `whatsapp_conversations` ativo pelo phone → handler cliente

**State machine (`whatsapp_conversations.state`):**

```
[inicial]
    ↓ cliente responde
awaiting_client_reply
    ↓ resposta = "SIM"
resolved (atualiza whatsapp_confirmed_at)

    ↓ resposta = "CANCELAR" ou "REAGENDAR"
awaiting_professional_auth
    ├── Luna → cliente: "Entendido! Aguarde, vou confirmar com {nome}."
    └── Luna → profissional:
          "⚠️ {client.name} quer {cancelar/reagendar}
           Procedimento: {procedure.name}
           Horário atual: {data/hora}
           Contato: {phone}
           Horários disponíveis: {3 próximos slots}

           Responda AUTORIZAR ou RECUSAR para eu continuar,
           ou entre em contato com a cliente diretamente."

awaiting_professional_auth
    ├── profissional: "AUTORIZAR"
    │     ├── cancel → cancela booking, confirma para cliente
    │     └── reschedule → reagenda no slot indicado, confirma para cliente
    │     → state = resolved
    │
    ├── profissional: "RECUSAR"
    │     → Luna avisa cliente: "A {nome} vai entrar em contato com você."
    │     → state = resolved
    │
    └── timeout 2h sem resposta
          → Luna avisa cliente: "{nome} vai entrar em contato em breve."
          → state = expired
```

---

## 8. Settings — Horários de Trabalho

Tela `/dashboard/settings` (fase pendente, implementar junto):

- Lista dos 7 dias da semana
- Cada dia: toggle ativo + hora início + hora fim (time input)
- Salva em `working_hours`
- Luna lê na íntegra a cada request (sem cache)

---

## 9. Serviços — Toggle Luna

`ServiceSheet` (existente): adicionar campo `Switch` shadcn:

```
Luna pode oferecer este serviço?  [●]
```

Default: `true`. Salva em `procedures.luna_enabled`.

---

## 10. Navegação

**`bottom-nav.tsx`:** trocar item Financeiro → Luna (ícone `Sparkles`, abre sheet)

**`header.tsx` / `header-menu.tsx`:** adicionar link Financeiro (ícone `TrendingUp`, rota `/dashboard/finance`)

---

## 11. Fora do Escopo (esta fase)

- Chat público para clientes (futuro — portal web)
- Migração Baileys → Meta WhatsApp Business API (futuro)
- Notificações push no dashboard
- Histórico de conversas Luna persistido no banco (apenas memória de sessão)

---

## 12. Ordem de Implementação Sugerida

1. Migrations Supabase (schema changes)
2. Instalar dependências `ai` + `@ai-sdk/anthropic`
3. Reescrever `/api/luna/route.ts` com streaming + tools
4. Reescrever `LunaWidget` → `LunaSheet` com `useChat`
5. Atualizar `lunaUIStore` (persistência + reset)
6. Atualizar bottom nav + header (navegação)
7. `ServiceSheet` — adicionar toggle `luna_enabled`
8. Settings — tela horários de trabalho
9. Cron WhatsApp confirmações
10. Webhook WhatsApp bidirecional + state machine
