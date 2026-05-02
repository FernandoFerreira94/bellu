# Plano 2 — OAuth Google Calendar + Token Management

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar OAuth flow completo para conectar Google Calendar, salvar tokens no Supabase e gerenciar refresh automático.

**Architecture:** Dois endpoints: `/api/google-calendar/auth` (inicia OAuth) e `/auth/google-calendar/callback` (recebe code, troca por tokens, salva). Token manager centralizado com refresh automático. Botão conectar/desconectar em Settings e Header.

**Tech Stack:** Next.js 15 App Router, Supabase, Google OAuth 2.0

**Responsável:** Claude

> ⚠️ **KEYS PENDENTES** — Tarefas 1-4 implementam a estrutura completa. Funcionará após configurar:
> - `GOOGLE_CLIENT_ID`
> - `GOOGLE_CLIENT_SECRET`
> - `GOOGLE_CALENDAR_REDIRECT_URI` = `https://[seu-dominio]/auth/google-calendar/callback`
> Adicionar ao `.env.local` e Vercel environment variables.

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/lib/google-token.ts` | Criar | Get/save/refresh tokens |
| `src/app/api/google-calendar/auth/route.ts` | Criar | Gera URL OAuth e redireciona |
| `src/app/auth/google-calendar/callback/route.ts` | Criar | Recebe code, troca tokens, salva |
| `src/app/api/google-calendar/disconnect/route.ts` | Criar | Deleta tokens |
| `src/components/settings/GoogleCalendarConnect.tsx` | Criar | Botão conectar/desconectar |
| `src/app/dashboard/settings/page.tsx` | Modificar | Adicionar GoogleCalendarConnect |
| `src/components/layout/header-menu.tsx` | Modificar | Substituir check manual por GoogleCalendarConnect |

---

### Task 1: Criar token manager

**Files:**
- Create: `src/lib/google-token.ts`

- [ ] Criar `src/lib/google-token.ts`:

```typescript
// src/lib/google-token.ts
import { createSupabaseServerClient } from '@/lib/supabase-server'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function getGoogleTokens(): Promise<{
  access_token: string
  refresh_token: string | null
  expires_at: string | null
} | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, expires_at')
    .maybeSingle()
  return data ?? null
}

export async function saveGoogleTokens(params: {
  access_token: string
  refresh_token: string | null
  expires_in: number
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const expires_at = new Date(Date.now() + params.expires_in * 1000).toISOString()

  await supabase
    .from('google_tokens')
    .upsert({
      user_id: user.id,
      access_token: params.access_token,
      refresh_token: params.refresh_token,
      expires_at,
    }, { onConflict: 'user_id' })
}

export async function deleteGoogleTokens(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.from('google_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000')
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getGoogleTokens()
  if (!tokens) return null

  const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null
  const isExpired = expiresAt ? expiresAt.getTime() - Date.now() < 5 * 60 * 1000 : false

  if (!isExpired) return tokens.access_token
  if (!tokens.refresh_token) return null

  // Refresh
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  })

  if (!res.ok) return null

  const data = await res.json()
  await saveGoogleTokens({
    access_token: data.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: data.expires_in,
  })

  return data.access_token
}
```

- [ ] Commit:
```bash
git add src/lib/google-token.ts
git commit -m "feat: add google token manager with auto-refresh"
```

---

### Task 2: Criar endpoints OAuth

**Files:**
- Create: `src/app/api/google-calendar/auth/route.ts`
- Create: `src/app/auth/google-calendar/callback/route.ts`
- Create: `src/app/api/google-calendar/disconnect/route.ts`

- [ ] Criar `src/app/api/google-calendar/auth/route.ts`:

```typescript
// src/app/api/google-calendar/auth/route.ts
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ')

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_CALENDAR_REDIRECT_URI!,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
```

- [ ] Criar `src/app/auth/google-calendar/callback/route.ts`:

```typescript
// src/app/auth/google-calendar/callback/route.ts
import { NextResponse } from 'next/server'
import { saveGoogleTokens } from '@/lib/google-token'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?gcal=error', request.url)
    )
  }

  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_CALENDAR_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?gcal=error', request.url)
    )
  }

  const tokens = await tokenRes.json()
  await saveGoogleTokens({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_in: tokens.expires_in,
  })

  // Triggar importação inicial em background
  fetch(new URL('/api/google-calendar/import', request.url).toString(), {
    method: 'POST',
    headers: { 'x-import-secret': process.env.CRON_SECRET! },
  }).catch(() => {}) // fire and forget

  return NextResponse.redirect(
    new URL('/dashboard/settings?gcal=connected', request.url)
  )
}
```

- [ ] Criar `src/app/api/google-calendar/disconnect/route.ts`:

```typescript
// src/app/api/google-calendar/disconnect/route.ts
import { NextResponse } from 'next/server'
import { deleteGoogleTokens } from '@/lib/google-token'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  await deleteGoogleTokens()
  return NextResponse.json({ success: true })
}
```

- [ ] Commit:
```bash
git add src/app/api/google-calendar/auth/ src/app/auth/google-calendar/ src/app/api/google-calendar/disconnect/
git commit -m "feat: add google calendar oauth flow and disconnect endpoint"
```

---

### Task 3: Criar componente GoogleCalendarConnect

**Files:**
- Create: `src/components/settings/GoogleCalendarConnect.tsx`

- [ ] Criar `src/components/settings/GoogleCalendarConnect.tsx`:

```tsx
// src/components/settings/GoogleCalendarConnect.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CalendarDays, Loader2, Unlink } from 'lucide-react'

interface GoogleCalendarConnectProps {
  connected: boolean
}

export function GoogleCalendarConnect({ connected }: GoogleCalendarConnectProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleConnect() {
    window.location.href = '/api/google-calendar/auth'
  }

  async function handleDisconnect() {
    setLoading(true)
    try {
      const res = await fetch('/api/google-calendar/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Google Calendar desconectado')
      router.refresh()
    } catch {
      toast.error('Erro ao desconectar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-5 w-5 text-stone-500" />
        <div>
          <p className="text-sm font-medium">Google Calendar</p>
          <p className="text-xs text-stone-500">
            {connected ? 'Agenda sincronizada com Bellu' : 'Conecte para sincronizar sua agenda'}
          </p>
        </div>
        {connected && (
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs">
            Conectado
          </Badge>
        )}
      </div>
      {connected ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          disabled={loading}
          className="text-stone-500 hover:text-rose-600"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
        </Button>
      ) : (
        <Button size="sm" onClick={handleConnect} className="bg-rose-500 hover:bg-rose-600">
          Conectar
        </Button>
      )}
    </div>
  )
}
```

- [ ] Commit:
```bash
git add src/components/settings/GoogleCalendarConnect.tsx
git commit -m "feat: add google calendar connect/disconnect component"
```

---

### Task 4: Integrar componente em Settings e Header

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`
- Modify: `src/components/layout/header-menu.tsx`

- [ ] Abrir `src/app/dashboard/settings/page.tsx` e adicionar seção Google Calendar após os horários:

```tsx
// Adicionar import no topo:
import { GoogleCalendarConnect } from '@/components/settings/GoogleCalendarConnect'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Dentro do componente (Server Component), buscar status:
const supabase = await createSupabaseServerClient()
const { data: gcalToken } = await supabase
  .from('google_tokens')
  .select('id')
  .maybeSingle()
const gcalConnected = !!gcalToken

// Adicionar seção antes do fechamento do container:
<div className="mt-6 border rounded-xl p-4 bg-white">
  <h2 className="text-sm font-semibold text-stone-700 mb-2">Integrações</h2>
  <GoogleCalendarConnect connected={gcalConnected} />
</div>
```

- [ ] Em `src/components/layout/header-menu.tsx`, substituir o `useEffect` manual de check por uso do componente:

```tsx
// Remover:
const [gcalConnected, setGcalConnected] = useState<boolean | null>(null)
useEffect(() => {
  supabase.from('google_tokens').select('id').maybeSingle().then(({ data }) => setGcalConnected(!!data))
}, [])

// Adicionar import:
import { GoogleCalendarConnect } from '@/components/settings/GoogleCalendarConnect'

// Passar gcalConnected como prop (buscar do server) ou manter estado client
// Simplificar: deixar apenas link para /dashboard/settings onde está o componente completo
// Substituir o bloco gcalConnected no menu por:
<Link href="/dashboard/settings" className="flex items-center gap-2 text-sm text-stone-600 py-2">
  <CalendarDays className="h-4 w-4" />
  Google Calendar
</Link>
```

- [ ] Verificar: `npx tsc --noEmit`
- [ ] Commit:
```bash
git add src/app/dashboard/settings/ src/components/layout/
git commit -m "feat: integrate google calendar connect in settings and header"
```

---

### Task 5: Tratar query params de retorno OAuth

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

- [ ] Ler `searchParams.gcal` para exibir toast após redirect:

```tsx
// settings/page.tsx — adicionar ao componente (pode ser client component wrapper ou usar searchParams server-side)
// Adicionar componente client pequeno para exibir toast:

// src/components/settings/GcalToast.tsx
'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export function GcalToast() {
  const params = useSearchParams()
  useEffect(() => {
    const gcal = params.get('gcal')
    if (gcal === 'connected') toast.success('Google Calendar conectado! Bellu está analisando sua agenda...')
    if (gcal === 'error') toast.error('Erro ao conectar Google Calendar. Tente novamente.')
  }, [params])
  return null
}
```

- [ ] Importar `<GcalToast />` em `settings/page.tsx` dentro de `<Suspense fallback={null}>`
- [ ] Commit:
```bash
git add src/components/settings/GcalToast.tsx src/app/dashboard/settings/
git commit -m "feat: show toast feedback after google calendar oauth redirect"
```
