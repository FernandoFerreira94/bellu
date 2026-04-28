# Auth + Onboarding — Design Spec
**Data:** 2026-04-28
**Projeto:** Ayumi Nails Web (luna-ayumi)
**Status:** Aprovado

---

## Visão Geral

Implementar autenticação real via Google OAuth (Supabase Auth) e fluxo de onboarding multi-step para a nail designer configurar seu studio na primeira vez que logar.

---

## Decisões de Arquitetura

- **Auth:** Supabase Auth com Google OAuth provider (já instalado, zero pacotes extras, integra com RLS)
- **Clerk:** descartado — não instalado, overhead desnecessário para 1 admin
- **Paleta de cores dinâmica:** descartada — complexidade alta, app mantém design rose/pink fixo
- **Onboarding:** multi-step (3 passos) — mais app-like

---

## Banco de Dados — Supabase

### Tabela: `studio_profile`

| coluna | tipo | constraints |
|---|---|---|
| `id` | uuid | PK, FK → auth.users.id |
| `studio_name` | text | NOT NULL |
| `owner_name` | text | NOT NULL |
| `specialty` | text | NOT NULL (enum: nail_designer, hair, makeup, waxing, massage, other) |
| `logo_url` | text | nullable |
| `onboarding_completed` | boolean | DEFAULT false |
| `created_at` | timestamptz | DEFAULT now() |

**RLS:**
- `SELECT`: `auth.uid() = id`
- `INSERT`: `auth.uid() = id`
- `UPDATE`: `auth.uid() = id`

### Storage: bucket `studio-assets`

- Acesso: público para leitura (exibir logo)
- Upload restrito ao usuário autenticado
- Pasta: `logos/{user_id}/logo.{ext}`
- Formatos aceitos: PNG, SVG
- Tamanho máximo: 2MB

---

## Fluxo de Auth

```
/ (login page)
  → clica "Entrar com Google"
  → Supabase signInWithOAuth({ provider: 'google' })
  → redirect para Google
  → Google autentica → callback para /auth/callback

/auth/callback (route handler)
  → troca code por session (supabase.auth.exchangeCodeForSession)
  → consulta studio_profile
    → existe e onboarding_completed = true → redirect /dashboard
    → não existe ou onboarding_completed = false → redirect /onboarding
```

---

## Middleware

Arquivo: `src/middleware.ts`

Regras (em ordem):
1. Sem sessão + rota `/dashboard/**` → redirect `/`
2. Com sessão + `onboarding_completed = false` + rota não-onboarding → redirect `/onboarding`
3. Com sessão + `onboarding_completed = true` + rota `/` → redirect `/dashboard`
4. Demais: passa adiante

Matcher: `['/', '/dashboard/:path*', '/onboarding']`

---

## Onboarding Multi-Step

### Step 1 — "Sobre você"
- Input: Nome do Studio (required)
- Input: Seu nome (required)
- Validação: Zod, mínimo 2 chars cada

### Step 2 — "Área de atuação"
- Badges selecionáveis (toggle): Nails Designer, Cabelo, Maquiagem, Depilação, Massagem, Outro
- Seleção única
- Required

### Step 3 — "Sua marca" (opcional)
- Upload de logo: PNG ou SVG, fundo transparente, max 2MB
- Preview circular após upload
- Botão "Pular" disponível
- Upload para Supabase Storage: `studio-assets/logos/{user_id}/logo.{ext}`

### Finalização
- POST para `/api/studio` com dados do form
- Seta `onboarding_completed = true`
- Redirect para `/dashboard`

---

## Arquivos

### Novos
- `src/middleware.ts` — proteção de rotas + redirect logic
- `src/app/(auth)/callback/route.ts` — OAuth callback handler
- `src/app/api/studio/route.ts` — POST: salvar studio_profile

### Modificados
- `src/app/(auth)/page.tsx` — botão Google com OAuth real
- `src/app/(auth)/onboarding/page.tsx` — rewrite multi-step com estado Zustand
- `src/types/index.ts` — adicionar type `StudioProfile`
- `src/lib/supabase.ts` — adicionar tabela `studio_profile` no tipo `Database`

### SQL (via MCP)
- Criar tabela `studio_profile`
- Criar RLS policies
- Criar bucket `studio-assets`
- Criar storage policy

---

## Requisitos Manuais (Fernando)

1. **Supabase Dashboard** → Authentication → Providers → habilitar **Google**
   - Inserir Client ID e Client Secret do Google
   - Redirect URI: `https://<projeto>.supabase.co/auth/v1/callback`

2. **Google Cloud Console** → APIs & Services → Credentials → OAuth 2.0
   - Authorized redirect URIs: `https://<projeto>.supabase.co/auth/v1/callback`
   - Para dev local adicionar também: `http://localhost:3000/auth/callback`

3. **`.env.local`** — confirmar que existem:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

---

## Fora do Escopo

- Paleta de cores dinâmica (descartada)
- Multi-tenant (apenas 1 admin)
- Recuperação de senha (Google OAuth não precisa)
- Email/senha auth
