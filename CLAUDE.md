# Ayumi Nails Web — CLAUDE.md

> Leia isto antes de codar qualquer feature.

## Projeto
Sistema de agendamento para nail designer solo (Ayumi Nails).
- Agenda baseada no Google Calendar (fonte da verdade)
- Clientes sem login (ID via WhatsApp/telefone)
- CRM básico + financeiro
- Pagamento via Mercado Pago (opcional)

## Stack
- Next.js 15 (App Router)
- TypeScript strict
- Tailwind CSS v4 + shadcn/ui + Magic UI
- Zustand (estado UI)
- Zod (validação)
- TanStack Query (data fetching)
- Supabase (Postgres + RLS)
- Clerk (auth admin)
- Google Calendar API (OAuth)
- Mercado Pago (pagamentos)
- Sonner (notificações)
- Vercel (deploy)

## Regras Técnicas
- TypeScript strict — sem `any`
- `'use client'` só quando necessário
- shadcn/ui sempre antes de criar componente custom
- React Query para fetch — nunca `useEffect` para dados
- Zustand só para estado de UI
- Zod em todos os inputs
- Mobile-first sempre
- Skeleton loading em tudo assíncrono
- RLS habilitado no Supabase
- Chaves sensíveis apenas server-side
- Mensagens em pt-BR
- Error handling obrigatório em todos os endpoints

## Arquitetura
```
src/
├── app/
│   ├── (public)/          # Agendamento público
│   │   ├── schedule/      # Fluxo: serviço → horário → confirmar
│   │   └── page.tsx       # Landing
│   ├── (auth)/            # Clerk UI
│   ├── dashboard/         # Área admin
│   ├── api/               # Webhooks, Google Calendar sync
│   └── layout.tsx
├── components/
│   ├── ui/                # shadcn — nunca modificar
│   ├── schedule/
│   ├── admin/
│   └── layout/
├── store/
├── hooks/
├── lib/
└── types/
```

## Fases (não implementar além da fase atual)
1. Setup base <- ATUAL
2. Schema banco de dados
3. CRUD procedimentos
4. Google Calendar (read)
5. Disponibilidade (core)
6. Agendamentos + booking flow
7. Google Calendar (write)
8. CRM básico
9. Financeiro
10. Dashboard admin
11. Pagamentos (Mercado Pago)
12. Automações (estrutura)

## Design
- Mobile-first, delicado, feminino
- Cores: rosa, branco, lilás
- Componentes grandes para mobile
- Sonner para feedback de ações
