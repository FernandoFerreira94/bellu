# Fase 13 — Google Calendar Sync Bidirecional

**Data:** 2026-05-02
**Status:** Aprovado

---

## Escopo

Integração bidirecional com Google Calendar:
1. **Write** — bookings criados/editados/cancelados no Bellu → espelhados no Google Calendar da profissional
2. **Read + Importação inteligente** — eventos do Google Calendar lidos e interpretados pela IA Bellu, populando clientes, procedimentos (stubs) e bookings automaticamente
3. **Overlay visual** — eventos pessoais do Google aparecem no WeekView como blocos cinza (não são bookings)
4. **Bellu (IA) ciente** — ao sugerir horários, cruza bookings com eventos do Google e avisa conflitos

> Nota: nome do assistente IA alterado de "Luna" para **Bellu** (nome do aplicativo).

---

## Arquitetura

```
Supabase (bookings) ──write──▶ Google Calendar API
                                      │
Google Calendar API ──webhook──▶ /api/google-calendar/webhook
                                      │
                              salva em google_calendar_events
                                      ├──▶ WeekView (overlay cinza)
                                      └──▶ Bellu IA (contexto)
```

**Fonte da verdade:** Supabase. Google Calendar é espelho + fonte de eventos pessoais.

---

## OAuth + Tokens

- Scopes: `calendar.readonly` + `calendar.events`
- Botão "Conectar Google Calendar" em: **Settings** + **Header menu**
- Flow: `/api/google-calendar/auth` → Google OAuth → `/auth/google-calendar/callback` → salva em `google_tokens`
- Refresh automático: verifica `expires_at` antes de cada chamada, renova se necessário
- Desconectar: deleta `google_tokens` row + cancela webhook registration
- Webhook do Google expira em 7 dias → cron job renova automaticamente

---

## Importação Inicial Inteligente (1x — ao conectar)

**Janela:** 2 semanas atrás + todos os eventos futuros

**Estratégia:** batch único para IA — não evento por evento.

1. Fetch todos os eventos do Google Calendar da janela
2. Envia tudo em uma chamada para Claude
3. Claude retorna JSON estruturado:
   - Lista de clientes extraídos (nome)
   - Lista de procedimentos extraídos (título)
   - Lista de bookings (cliente + procedimento + data/hora)
4. Sistema executa:
   - Clientes: verifica se existe por nome → cria se não existir (sem telefone)
   - Procedimentos: verifica se existe por título → cria stub se não existir (sem duração/preço)
   - Bookings: cria com status `confirmed`
5. Após sync: Bellu exibe no chat resumo + lista de pendências

**UI durante sync:**
- Ícone pequeno no canto inferior direito (spinner + "Sincronizando com Google Calendar")
- App continua funcional — não bloqueia navegação
- Ao finalizar: toast + mensagem do Bellu no chat

**Pendências que Bellu reporta no chat:**
- Procedimentos sem duração/preço → "Acesse Serviços para completar"
- Clientes sem telefone → "Adicione o contato para enviar confirmações via WhatsApp"
- Eventos não reconhecidos (não seguem padrão) → lista para revisão manual

---

## Sync Contínuo (pós-importação)

- Webhook Google → `/api/google-calendar/webhook` → atualiza `google_calendar_events`
- Não sincroniza no login — tudo em tempo real via webhook
- Eventos criados manualmente no Google → overlay cinza no WeekView (não viram booking automático)
- Bookings criados no Bellu → escrevem evento no Google Calendar (título: "Atendimento: [cliente] — [procedimento]")

---

## Banco de Dados — Novas tabelas/colunas

### `google_calendar_events` (nova)
```sql
id              uuid PK
user_id         uuid FK auth.users
google_event_id text UNIQUE
title           text
description     text nullable
start_time      timestamptz
end_time        timestamptz
is_personal     boolean default true  -- diferencia evento pessoal de booking espelhado
synced_at       timestamptz
```

### `procedures` — nova coluna
```sql
google_calendar_title text nullable  -- título como aparece no Google Calendar
```

---

## WeekView — Overlay de eventos pessoais

- Eventos de `google_calendar_events` onde `is_personal = true` → bloco cinza semi-transparente
- Não clicável para editar (não é booking)
- Tooltip ao hover/tap: título do evento + horário
- Bellu avisa ao criar booking que conflita com evento pessoal

---

## Renomeação Luna → Bellu

- Componente `LunaWidget` → `BelluWidget`
- Store `lunaUIStore` → `belluUIStore`
- Arquivos `luna-context.ts`, `luna-tools.ts` → `bellu-context.ts`, `bellu-tools.ts`
- API route `/api/luna` → `/api/bellu`
- System prompt: "Você é Bellu, assistente pessoal da..."
- UI: todas as referências textuais "Luna" → "Bellu"

---

## Divisão de tarefas — Claude vs Codex

| Tarefa | Responsável |
|---|---|
| OAuth flow + token refresh | **Claude** (complexidade + segurança) |
| Importação batch com IA | **Claude** (lógica de IA + parsing) |
| Webhook handler + renew cron | **Claude** (arquitetura crítica) |
| Bellu context update (Google events) | **Claude** (integração IA) |
| Write booking → Google event | Codex |
| UI: botão conectar em Settings + Header | Codex |
| UI: overlay cinza no WeekView | Codex |
| UI: ícone de sync | Codex |
| Renomeação Luna → Bellu (arquivos/UI) | Codex |
| Migration SQL google_calendar_events | Codex |
