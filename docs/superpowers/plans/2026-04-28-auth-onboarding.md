# Auth + Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar Google OAuth via Supabase Auth + fluxo de onboarding multi-step (3 passos) para configuração inicial do studio.

**Architecture:** Supabase Auth gerencia sessão via cookies com `@supabase/ssr`. Middleware do Next.js protege rotas e redireciona conforme estado do onboarding. Onboarding salva `studio_profile` no Supabase com upload de logo no Storage.

**Tech Stack:** Next.js 15 App Router, Supabase Auth, @supabase/ssr, TypeScript strict, Tailwind CSS, shadcn/ui, Sonner, Zod

---

## Mapa de Arquivos

| Arquivo                              | Ação       | Responsabilidade                                            |
| ------------------------------------ | ---------- | ----------------------------------------------------------- |
| `src/lib/supabase-server.ts`         | Criar      | Client Supabase para Server Components e Route Handlers     |
| `src/lib/supabase-browser.ts`        | Criar      | Client Supabase para Client Components                      |
| `src/middleware.ts`                  | Criar      | Proteção de rotas + redirects por estado de auth/onboarding |
| `src/app/(auth)/callback/route.ts`   | Criar      | OAuth callback — troca code por session                     |
| `src/app/(auth)/page.tsx`            | Modificar  | Botão Google com OAuth real                                 |
| `src/app/(auth)/onboarding/page.tsx` | Reescrever | Multi-step form (3 passos)                                  |
| `src/app/api/studio/route.ts`        | Criar      | POST — salva studio_profile no Supabase                     |
| `src/types/index.ts`                 | Modificar  | Adicionar type `StudioProfile` e `Specialty`                |
| `src/lib/supabase.ts`                | Modificar  | Adicionar `studio_profile` ao tipo `Database`               |

---

## Task 1: Instalar @supabase/ssr

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Instalar pacote**

```bash
npm install @supabase/ssr
```

- [ ] **Step 2: Verificar instalação**

```bash
npm list @supabase/ssr
```

Expected: `@supabase/ssr@x.x.x`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @supabase/ssr for Next.js App Router auth"
```

---

## Task 2: Aplicar migração SQL no Supabase (via MCP)

**Files:** Nenhum arquivo local — executado via Supabase MCP

- [ ] **Step 1: Executar SQL de criação da tabela e RLS**

SQL a executar via `mcp__claude_ai_Supabase__execute_sql`:

```sql
-- Tabela studio_profile
CREATE TABLE IF NOT EXISTS public.studio_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT 'nail_designer',
  logo_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.studio_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.studio_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "owner_insert" ON public.studio_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "owner_update" ON public.studio_profile
  FOR UPDATE USING (auth.uid() = id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-assets', 'studio-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "upload_own_logo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'studio-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "read_logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'studio-assets');

CREATE POLICY "update_own_logo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'studio-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "delete_own_logo" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'studio-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

- [ ] **Step 2: Verificar tabela criada**

Executar: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'studio_profile';`

Expected: colunas id, studio_name, owner_name, specialty, logo_url, onboarding_completed, created_at

---

## Task 3: Adicionar types e atualizar Database type

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/lib/supabase.ts`

- [ ] **Step 1: Adicionar types em `src/types/index.ts`**

Adicionar ao final do arquivo:

```typescript
export type Specialty =
  | "nail_designer"
  | "hair"
  | "makeup"
  | "waxing"
  | "massage"
  | "other";

export type StudioProfile = {
  id: string;
  studio_name: string;
  owner_name: string;
  specialty: Specialty;
  logo_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
};
```

- [ ] **Step 2: Adicionar `studio_profile` ao tipo `Database` em `src/lib/supabase.ts`**

Dentro de `Tables`, adicionar após `whatsapp_sessions`:

```typescript
studio_profile: {
  Row: StudioProfile;
  Insert: Omit<StudioProfile, "created_at">;
  Update: Partial<Omit<StudioProfile, "id" | "created_at">>;
}
```

Adicionar import de `StudioProfile` e `Specialty` no topo do arquivo:

```typescript
import type {
  CalendarEvent,
  Client,
  FinanceEntry,
  Service,
  Settings,
  StudioProfile,
  WhatsAppSession,
  WorkingHours,
} from "@/types";
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/lib/supabase.ts
git commit -m "feat: add StudioProfile type and Database mapping"
```

---

## Task 4: Criar clientes Supabase para SSR

**Files:**

- Create: `src/lib/supabase-server.ts`
- Create: `src/lib/supabase-browser.ts`

- [ ] **Step 1: Criar `src/lib/supabase-server.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}
```

- [ ] **Step 2: Criar `src/lib/supabase-browser.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase-server.ts src/lib/supabase-browser.ts
git commit -m "feat: add Supabase SSR client helpers"
```

---

## Task 5: Criar callback de OAuth

**Files:**

- Create: `src/app/(auth)/callback/route.ts`

- [ ] **Step 1: Criar `src/app/(auth)/callback/route.ts`**

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/`);
  }

  const { data: profile } = await supabase
    .from("studio_profile")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/callback/route.ts
git commit -m "feat: add OAuth callback route handler"
```

---

## Task 6: Criar middleware de proteção de rotas

**Files:**

- Create: `src/middleware.ts`

- [ ] **Step 1: Criar `src/middleware.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Sem sessão → proteger dashboard
  if (!user && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("studio_profile")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    const completed = profile?.onboarding_completed ?? false;

    // Sessão sem onboarding → forçar onboarding
    if (
      !completed &&
      !path.startsWith("/onboarding") &&
      !path.startsWith("/auth")
    ) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Sessão com onboarding completo + página de login → dashboard
    if (completed && path === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/onboarding"],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware with onboarding redirect logic"
```

---

## Task 7: Atualizar página de login com OAuth real

**Files:**

- Modify: `src/app/(auth)/page.tsx`

- [ ] **Step 1: Reescrever `src/app/(auth)/page.tsx`**

```typescript
"use client"
import Image from "next/image";
import Logo from "@/assets/logo-bellu.png"
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useState } from "react";
import { toast } from "sonner";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
  </svg>
);

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error('Erro ao entrar com Google. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-6 py-12 flex flex-col items-center justify-between relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center justify-center w-full">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center space-y-3">
            <div className="p-4">
              <Image src={Logo} alt="Logo" width={80} height={80} />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-4xl flex items-center justify-center font-extralight text-tercery font-mono">
                Be <span className="text-primary font-medium font-serif">llu</span>
              </h1>
              <p className="text-sm tracking-widest text-zinc-500 mt-2">Seu negócio na palma da mão</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 pb-4">
        <Button onClick={handleGoogleLogin} disabled={loading}>
          <GoogleIcon />
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Ao continuar, você concorda com os termos de uso.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/page.tsx
git commit -m "feat: wire Google OAuth on login page"
```

---

## Task 8: Criar API route para salvar studio_profile

**Files:**

- Create: `src/app/api/studio/route.ts`

- [ ] **Step 1: Criar `src/app/api/studio/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { z } from "zod";

const studioSchema = z.object({
  studio_name: z.string().min(2, "Mínimo 2 caracteres"),
  owner_name: z.string().min(2, "Mínimo 2 caracteres"),
  specialty: z.enum([
    "nail_designer",
    "hair",
    "makeup",
    "waxing",
    "massage",
    "other",
  ]),
  logo_url: z.string().url().nullable().optional(),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = studioSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("studio_profile").upsert({
    id: user.id,
    ...parsed.data,
    logo_url: parsed.data.logo_url ?? null,
    onboarding_completed: true,
  });

  if (error) {
    return NextResponse.json(
      { error: "Erro ao salvar perfil" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/studio/route.ts
git commit -m "feat: add API route to save studio_profile"
```

---

## Task 9: Reescrever onboarding multi-step

**Files:**

- Modify: `src/app/(auth)/onboarding/page.tsx`

- [ ] **Step 1: Reescrever `src/app/(auth)/onboarding/page.tsx`**

```typescript
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { Specialty } from "@/types"

type Step = 1 | 2 | 3

type FormData = {
  studio_name: string
  owner_name: string
  specialty: Specialty | null
  logo_url: string | null
}

const step1Schema = z.object({
  studio_name: z.string().min(2, 'Mínimo 2 caracteres'),
  owner_name: z.string().min(2, 'Mínimo 2 caracteres'),
})

const SPECIALTIES: { value: Specialty; label: string }[] = [
  { value: 'nail_designer', label: 'Nails Designer' },
  { value: 'hair', label: 'Cabelo' },
  { value: 'makeup', label: 'Maquiagem' },
  { value: 'waxing', label: 'Depilação' },
  { value: 'massage', label: 'Massagem' },
  { value: 'other', label: 'Outro' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<FormData>({
    studio_name: '',
    owner_name: '',
    specialty: null,
    logo_url: null,
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  function handleStep1() {
    const parsed = step1Schema.safeParse({
      studio_name: form.studio_name,
      owner_name: form.owner_name,
    })
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message)
      return
    }
    setStep(2)
  }

  function handleStep2() {
    if (!form.specialty) {
      toast.error('Selecione sua área de atuação')
      return
    }
    setStep(3)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo deve ter no máximo 2MB')
      return
    }

    if (!['image/png', 'image/svg+xml'].includes(file.type)) {
      toast.error('Apenas PNG ou SVG')
      return
    }

    setUploading(true)
    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Sessão expirada. Faça login novamente.')
      setUploading(false)
      return
    }

    const ext = file.type === 'image/svg+xml' ? 'svg' : 'png'
    const path = `logos/${user.id}/logo.${ext}`

    const { error } = await supabase.storage
      .from('studio-assets')
      .upload(path, file, { upsert: true })

    if (error) {
      toast.error('Erro ao enviar logo')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('studio-assets')
      .getPublicUrl(path)

    setForm((f) => ({ ...f, logo_url: publicUrl }))
    setLogoPreview(URL.createObjectURL(file))
    setUploading(false)
    toast.success('Logo enviada!')
  }

  async function handleFinish() {
    setLoading(true)
    const res = await fetch('/api/studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studio_name: form.studio_name,
        owner_name: form.owner_name,
        specialty: form.specialty,
        logo_url: form.logo_url,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Erro ao salvar perfil')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const stepLabels = ['Sobre você', 'Atuação', 'Sua marca']

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {step > 1 && (
          <button onClick={handleBack} className="text-muted-foreground">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex gap-1.5 flex-1">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h1 className="text-2xl font-medium text-tercery mb-1">Sobre você</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Vamos personalizar seu espaço. Você pode editar tudo depois.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studio_name" className="uppercase text-xs tracking-wider">
                Nome do Studio
              </Label>
              <Input
                id="studio_name"
                placeholder="Ex: Studio Ayumi"
                value={form.studio_name}
                onChange={(e) => setForm((f) => ({ ...f, studio_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name" className="uppercase text-xs tracking-wider">
                Seu nome
              </Label>
              <Input
                id="owner_name"
                placeholder="Ex: Ayumi"
                value={form.owner_name}
                onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h1 className="text-2xl font-medium text-tercery mb-1">Área de atuação</h1>
          <p className="text-muted-foreground text-sm mb-6">
            O que você faz? Selecione uma opção.
          </p>
          <div className="flex gap-2 flex-wrap">
            {SPECIALTIES.map(({ value, label }) => (
              <button key={value} onClick={() => setForm((f) => ({ ...f, specialty: value }))}>
                <Badge
                  variant={form.specialty === value ? 'default' : 'outline'}
                  className="cursor-pointer text-sm py-1.5 px-3 transition-colors"
                >
                  {label}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h1 className="text-2xl font-medium text-tercery mb-1">Sua marca</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Adicione sua logo. PNG ou SVG com fundo transparente. Opcional.
          </p>
          <div className="flex flex-col items-center gap-6">
            {logoPreview ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoPreview}
                  alt="Preview da logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                <span className="text-muted-foreground text-xs text-center px-2">Sua logo</span>
              </div>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/png,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <span className="text-sm text-primary underline underline-offset-2">
                {uploading ? 'Enviando...' : logoPreview ? 'Trocar logo' : 'Escolher logo'}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="pb-4 space-y-3">
        {step === 1 && (
          <Button size="lg" className="w-full rounded-full" onClick={handleStep1}>
            Continuar
          </Button>
        )}
        {step === 2 && (
          <Button size="lg" className="w-full rounded-full" onClick={handleStep2}>
            Continuar
          </Button>
        )}
        {step === 3 && (
          <>
            <Button
              size="lg"
              className="w-full rounded-full"
              onClick={handleFinish}
              disabled={loading || uploading}
            >
              {loading ? 'Salvando...' : 'Entrar no dashboard'}
            </Button>
            {!form.logo_url && (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-full text-center text-sm text-muted-foreground"
              >
                Pular por agora
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/onboarding/page.tsx
git commit -m "feat: multi-step onboarding (studio name, specialty, logo)"
```

---

## Checklist Final

- [ ] `@supabase/ssr` instalado
- [ ] `studio_profile` table criada com RLS no Supabase
- [ ] Bucket `studio-assets` criado com policies
- [ ] Types `StudioProfile` e `Specialty` em `src/types/index.ts`
- [ ] `Database` type atualizado em `src/lib/supabase.ts`
- [ ] `src/lib/supabase-server.ts` criado
- [ ] `src/lib/supabase-browser.ts` criado
- [ ] `/auth/callback` redireciona corretamente
- [ ] Middleware protege `/dashboard/**` e `/onboarding`
- [ ] Login page chama `signInWithOAuth`
- [ ] API `/api/studio` valida e salva com Zod
- [ ] Onboarding multi-step 3 passos funcional

## Configuração Manual (Fernando)

Antes de testar:

1. **Supabase Dashboard** → Auth → Providers → Google → Enable → inserir Client ID + Secret
2. **Google Cloud Console** → criar OAuth credentials:
   - Authorized redirect URI: `https://<ref>.supabase.co/auth/v1/callback`
   - Para dev: `http://localhost:3000/auth/callback`
3. `.env.local` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
