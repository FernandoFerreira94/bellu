# Ayumi Nails Web — CLAUDE.md

> Leia isto antes de codar qualquer feature.

## Projeto
Sistema de agendamento mobile-first para nail designer solo (Ayumi Nails / "Bellu").
- Agenda baseada na tabela `bookings` no Supabase (Google Calendar como espelho — fase futura)
- Apenas a nail designer acessa o dashboard (auth via Supabase Google OAuth)
- CRM básico de clientes
- **Bellu**: assistente IA no dashboard + WhatsApp (confirmação 24h)

---

## Stack real (instalada e em uso)
- Next.js 15 (App Router) + TypeScript strict
- Tailwind CSS v4 + shadcn/ui
- Zustand (estado de UI)
- Zod (validação)
- TanStack Query v5 (data fetching)
- Supabase (Postgres + RLS + Auth + Storage)
- **Supabase Auth** com Google OAuth — **NÃO usa Clerk**
- `@supabase/ssr` 0.10.x para Next.js App Router (cookie-based sessions)
- Framer Motion (animações moderadas)
- Sonner (notificações toast)
- Vercel (deploy)
- Anthropic SDK (Claude — chatbot Bellu no dashboard)

---

## Regras Técnicas
- TypeScript strict — sem `any`
- `'use client'` só quando necessário
- shadcn/ui sempre antes de criar componente custom
- React Query para fetch — nunca `useEffect` para dados
- Zustand só para estado de UI
- Zod em todos os inputs
- **Mobile-first sempre** — projeto focado em tela mobile
- Skeleton loading em tudo assíncrono
- RLS habilitado no Supabase — sempre testar com usuário autenticado
- Chaves sensíveis apenas server-side
- Mensagens em pt-BR
- Error handling obrigatório em todos os endpoints

---

## Supabase — Regras Críticas

### Cliente correto por contexto
| Contexto | Cliente | Import |
|---|---|---|
| Server Components / Route Handlers | `createSupabaseServerClient()` | `@/lib/supabase-server` |
| Client Components / Hooks | `sb` (singleton SSR-aware) | `@/lib/supabase-browser` |
| **NUNCA usar** | `supabase` singleton de `@/lib/supabase` | não tem cookie → RLS bloqueia |

### Schema real (projeto `xibcbjyhtvzlkgjbywru`)
- `clients` → id, name, phone, email, notes, created_at, updated_at
- `procedures` → id, name, duration (int, min), price (numeric), description, active (bool), created_at, updated_at
- `studio_profile` → FK via `id` (não `user_id`) para auth.users | campos: phone, luna_whatsapp_number, luna_confirmation_enabled, luna_client_enabled
- `bookings`, `working_hours`, `blocks`, `transactions`, `messages` — existem, verificar colunas antes de usar
- **Antes de criar qualquer hook, verificar colunas reais via MCP Supabase**

### Auth
- OAuth callback em `src/app/auth/callback/route.ts` (FORA de qualquer route group)
- Route groups `(auth)`, `(public)` etc. não viram segmento de URL

---

## Design
- **Foco total: mobile** — tela pequena, app-like
- Estilo: minimalista, delicado, feminino — **não usar fundo rosa** no header (branco com borda sutil)
- Paleta fixa: rose/stone — **sem temas dinâmicos ou customização de paleta**
- Tipografia limpa, espaçamento generoso
- Componentes grandes para toque mobile
- Sem poluição visual — espaço em branco é design
- Sonner para feedback de ações
- Transições suaves (framer-motion moderado)
- Sheets `side="bottom"` para formulários mobile (padrão do projeto)

---

## Bellu — WhatsApp Bot (regras críticas)
- **Fase inicial**: Bellu só envia confirmação **24h antes** do agendamento
- **Horário permitido**: 08:00–18:00 APENAS
- Se confirmação cair fora do horário → agendar para próximo período válido (ex: dia anterior às 17:00)

---

## Bellu — Chatbot IA no Dashboard
Assistente IA embutido no dashboard. Powered by Claude (Anthropic SDK).

### Capacidades:
1. Criar/editar/cancelar agendamentos via linguagem natural
2. Consultar clientes, histórico, procedimentos
3. Exportar horários vagos formatados para WhatsApp/Instagram
4. Responder dúvidas sobre clientes e faturamento
5. Enviar confirmações rápidas por WhatsApp

### Regras:
- Respeitar horário 08:00–18:00
- Confirmar antes de ações destrutivas
- Linguagem informal — como assistente pessoal
- Respostas curtas, detalhes só se pedido

---

## Arquitetura real (estado atual)
```
src/
├── app/
│   ├── auth/callback/          # OAuth callback (FORA de route groups)
│   ├── (auth)/                 # Páginas de login/onboarding
│   ├── dashboard/
│   │   ├── layout.tsx          # Busca studio_profile, renderiza Header + Shell
│   │   ├── page.tsx            # Overview
│   │   ├── calendar/           # Calendário (em desenvolvimento)
│   │   ├── clients/            # CRM — lista + sheet bottom ✅
│   │   ├── services/           # CRUD procedimentos — sheet bottom ✅
│   │   ├── finance/            # Financeiro (pendente)
│   │   ├── settings/           # Horários de expediente (pendente)
│   │   └── profile/            # Perfil do studio ✅
│   └── api/
│       ├── google-calendar/
│       ├── bellu/
│       └── whatsapp/
├── components/
│   ├── ui/                     # shadcn — nunca modificar diretamente
│   ├── layout/                 # Header (accordion mobile), BottomNav, DashboardShell
│   ├── clients/                # ClientList, ClientSheet ✅
│   ├── services/               # ServiceList, ServiceSheet ✅
│   ├── profile/                # ProfileForm ✅
│   ├── calendar/               # WeekView ✅
│   ├── sync/                   # SyncIndicator
│   └── bellu/                  # BelluWidget, BelluSheet
├── hooks/
│   ├── useClients.ts           # useClients, useCreateClient, useUpdateClient ✅
│   ├── useServices.ts          # useServices, useCreateService, useUpdateService, useDeleteService ✅
│   ├── useBookings.ts          # ✅
│   └── useGoogleCalendar.ts
├── store/
│   ├── belluUIStore.ts
│   ├── syncStore.ts
│   └── dashboardUIStore.ts
├── lib/
│   ├── supabase.ts             # tipos Database + singleton legado (não usar em hooks)
│   ├── supabase-browser.ts     # sb (singleton SSR-aware) — usar em hooks/client components
│   ├── supabase-server.ts      # createSupabaseServerClient — usar em server components
│   ├── google-calendar-api.ts  # Google Calendar REST API client
│   ├── google-token.ts         # OAuth token management
│   ├── bellu.ts
│   ├── bellu-context.ts        # system prompt com dados reais
│   ├── bellu-tools.ts          # AI SDK tools
│   ├── bellu-import.ts         # importação batch inteligente do Google Calendar
│   └── availability.ts        # lógica de slots 08-18
└── types/
    └── index.ts
```

---

## Regras de Disponibilidade
- Expediente: **08:00 às 18:00** (configurável em `working_hours`)
- Nunca gerar slot antes de 08:00 ou depois de 18:00
- Considerar duração do procedimento (`procedures.duration`) + buffer
- Antecedência mínima: 2 horas para agendamento online
- Blocos em `blocks` = indisponibilidade

---

## Fases
1. Setup base ✅
2. Schema banco de dados ✅
3. Schema Supabase aplicado ✅
4. Google Auth OAuth + onboarding ✅
5. Disponibilidade (slots) + Calendário visual ✅
6. Dashboard: Clientes ✅
7. Dashboard: Serviços (procedures) ✅
8. Dashboard: Financeiro ✅
9. Bellu — Infraestrutura DB + UI configuração ✅
10. Dashboard: Bellu chatbot IA ⏳ (aguarda API key Anthropic)
11. Bellu — WhatsApp infraestrutura ✅ (aguarda número para conectar)
12. Google Calendar (write) ⏳ — rename concluído, OAuth+import em andamento

---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
