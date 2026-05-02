# Plano 1 — Rename Luna → Bellu

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renomear todos os arquivos, componentes, stores, rotas e textos de "Luna" para "Bellu" em todo o projeto.

**Architecture:** Rename puro — sem mudança de lógica. Arquivos renomeados, imports atualizados, textos de UI alterados.

**Tech Stack:** Next.js 15, TypeScript, Zustand

**Responsável:** Codex

---

## Mapa de arquivos

| De | Para |
|---|---|
| `src/lib/luna.ts` | `src/lib/bellu.ts` |
| `src/lib/luna-context.ts` | `src/lib/bellu-context.ts` |
| `src/lib/luna-tools.ts` | `src/lib/bellu-tools.ts` |
| `src/lib/luna-whatsapp.ts` | `src/lib/bellu-whatsapp.ts` |
| `src/app/api/luna/route.ts` | `src/app/api/bellu/route.ts` |
| `src/store/lunaUIStore.ts` | `src/store/belluUIStore.ts` |
| `src/components/luna/LunaWidget.tsx` (e todos em `luna/`) | `src/components/bellu/BelluWidget.tsx` |
| `src/app/dashboard/luna/page.tsx` | `src/app/dashboard/bellu/page.tsx` |

---

### Task 1: Renomear arquivos de lib

**Files:**
- Rename: `src/lib/luna.ts` → `src/lib/bellu.ts`
- Rename: `src/lib/luna-context.ts` → `src/lib/bellu-context.ts`
- Rename: `src/lib/luna-tools.ts` → `src/lib/bellu-tools.ts`
- Rename: `src/lib/luna-whatsapp.ts` → `src/lib/bellu-whatsapp.ts`

- [ ] Renomear `src/lib/luna.ts` → `src/lib/bellu.ts`
- [ ] Renomear `src/lib/luna-context.ts` → `src/lib/bellu-context.ts`
- [ ] Renomear `src/lib/luna-tools.ts` → `src/lib/bellu-tools.ts`
- [ ] Renomear `src/lib/luna-whatsapp.ts` → `src/lib/bellu-whatsapp.ts`
- [ ] Em cada arquivo renomeado, substituir qualquer string interna `"luna"` ou `"Luna"` por `"bellu"` / `"Bellu"` onde for nome de função, variável ou comentário (não em valores de banco de dados ainda)
- [ ] Commit:
```bash
git add src/lib/
git commit -m "refactor: rename luna lib files to bellu"
```

---

### Task 2: Renomear API route e store

**Files:**
- Create: `src/app/api/bellu/route.ts` (conteúdo de `/api/luna/route.ts`)
- Delete: `src/app/api/luna/route.ts`
- Rename: `src/store/lunaUIStore.ts` → `src/store/belluUIStore.ts`

- [ ] Criar `src/app/api/bellu/` e mover conteúdo de `src/app/api/luna/route.ts` para `src/app/api/bellu/route.ts`
- [ ] Atualizar import dentro do novo `route.ts`: `from '@/lib/luna-context'` → `from '@/lib/bellu-context'`, `from '@/lib/luna-tools'` → `from '@/lib/bellu-tools'`
- [ ] Deletar `src/app/api/luna/route.ts` e pasta `src/app/api/luna/`
- [ ] Renomear `src/store/lunaUIStore.ts` → `src/store/belluUIStore.ts`
- [ ] Dentro do store renomeado: substituir `lunaUI` → `belluUI`, `LunaUI` → `BelluUI`, `useLunaUIStore` → `useBelluUIStore`
- [ ] Commit:
```bash
git add src/app/api/ src/store/
git commit -m "refactor: rename luna api route and store to bellu"
```

---

### Task 3: Renomear componentes e página

**Files:**
- Rename: `src/components/luna/` → `src/components/bellu/`
- Rename: `src/app/dashboard/luna/` → `src/app/dashboard/bellu/`

- [ ] Renomear pasta `src/components/luna/` → `src/components/bellu/`
- [ ] Dentro dos componentes: renomear `LunaWidget` → `BelluWidget`, `Luna` → `Bellu` em nomes de componente e displayName
- [ ] Renomear pasta `src/app/dashboard/luna/` → `src/app/dashboard/bellu/`
- [ ] Commit:
```bash
git add src/components/ src/app/dashboard/
git commit -m "refactor: rename luna components and dashboard page to bellu"
```

---

### Task 4: Atualizar todos os imports e referências

**Files:**
- Modify: qualquer arquivo que importa de `@/lib/luna*`, `@/store/lunaUIStore`, `@/components/luna/*`, `@/app/api/luna`

- [ ] Buscar todos os imports de `luna` no projeto:
```bash
grep -r "from.*luna\|/luna\|/api/luna" src/ --include="*.ts" --include="*.tsx" -l
```
- [ ] Para cada arquivo encontrado, atualizar imports:
  - `from '@/lib/luna'` → `from '@/lib/bellu'`
  - `from '@/lib/luna-context'` → `from '@/lib/bellu-context'`
  - `from '@/lib/luna-tools'` → `from '@/lib/bellu-tools'`
  - `from '@/lib/luna-whatsapp'` → `from '@/lib/bellu-whatsapp'`
  - `from '@/store/lunaUIStore'` → `from '@/store/belluUIStore'`
  - `from '@/components/luna/LunaWidget'` → `from '@/components/bellu/BelluWidget'`
  - `useLunaUIStore` → `useBelluUIStore`
  - `/api/luna` → `/api/bellu` (fetch calls)
- [ ] Commit:
```bash
git add -A
git commit -m "refactor: update all luna imports to bellu"
```

---

### Task 5: Atualizar textos de UI

**Files:**
- Modify: `src/components/bellu/BelluWidget.tsx`
- Modify: `src/app/dashboard/bellu/page.tsx`
- Modify: `src/components/layout/header-menu.tsx`
- Modify: `src/lib/bellu-context.ts` (system prompt)

- [ ] Em `BelluWidget.tsx`: substituir todo texto visível `"Luna"` → `"Bellu"`
- [ ] Em `dashboard/bellu/page.tsx`: substituir títulos e descrições `"Luna"` → `"Bellu"`
- [ ] Em `header-menu.tsx`: link "Luna — Configurações" → "Bellu — Configurações", href `/dashboard/luna` → `/dashboard/bellu`
- [ ] Em `bellu-context.ts` (system prompt): `"Você é Luna"` → `"Você é Bellu"`
- [ ] Verificar: `npx tsc --noEmit` sem erros de tipo
- [ ] Commit:
```bash
git add -A
git commit -m "refactor: update all UI text from Luna to Bellu"
```

---

### Task 6: Verificação final

- [ ] Rodar build local: `npm run build`
- [ ] Verificar que não há referências restantes ao nome antigo:
```bash
grep -r "luna\|Luna" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules\|.next"
```
- [ ] Revisar manualmente os resultados — alguns podem ser legítimos (ex: nomes de clientes em dados de exemplo)
- [ ] Se build OK e sem referências indevidas, o plano 1 está concluído
