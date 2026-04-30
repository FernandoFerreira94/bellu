# Header Accordion Menu — Design Spec

**Data:** 2026-04-28
**Status:** Aprovado — aguardando implementação

---

## Objetivo

Substituir o dropdown flutuante do UserMenu por um accordion que expande o próprio header para baixo, empurrando o conteúdo da página. Mobile-first.

---

## Comportamento

- Clicar no avatar → header cresce com `framer-motion` (height animado)
- Conteúdo da página empurrado para baixo (não sobreposto)
- Fechar: clicar fora do header OU clicar no avatar novamente
- Apenas no mobile (`lg:hidden` — mesmo breakpoint do header atual)

---

## Seções do menu

### Perfil
- Exibe foto + nome do studio + "como quer ser chamada"
- Edição inline de "Nome do studio" (input aparece no lugar, salva em `studio_profile.studio_name`)
- Edição inline de "Como quer ser chamada" (salva em `studio_profile.owner_name`)
- Botão **Sair** → `supabase.auth.signOut()` + redirect `/`
- Botão **Excluir conta** → abre `AlertDialog` shadcn com confirmação por texto

### Serviços
- Link de navegação para `/dashboard/services`

### Horários de expediente
- Link de navegação para `/dashboard/settings`

### Integrações
- Status do Google Calendar (conectado/desconectado)
- Botão reconectar se desconectado

### Luna
- Botão que abre o chat widget (`setWidgetOpen(true)`)

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/layout/header.tsx` | Adiciona estado `open`, renderiza `HeaderMenu` abaixo do header bar |
| `src/components/layout/user-menu.tsx` | Vira só o botão avatar — recebe prop `onClick` |
| `src/components/layout/header-menu.tsx` | **Novo** — painel accordion com todas as seções |

---

## Dependências

- `framer-motion` (já instalado)
- `shadcn/ui AlertDialog` (já disponível em `src/components/ui/alert-dialog.tsx`)
- `supabase` client
- `useLunaUIStore` (já usado)
- `studio_profile` table (já existe no schema)
