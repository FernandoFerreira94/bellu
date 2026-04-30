# Graph Report - .  (2026-04-28)

## Corpus Check
- Corpus is ~18,461 words - fits in a single context window. You may not need a graph.

## Summary
- 230 nodes · 169 edges · 75 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth Onboarding + Brand Assets|Auth Onboarding + Brand Assets]]
- [[_COMMUNITY_Project Spec & Luna Bot Rules|Project Spec & Luna Bot Rules]]
- [[_COMMUNITY_Select UI Component|Select UI Component]]
- [[_COMMUNITY_Google Calendar Integration|Google Calendar Integration]]
- [[_COMMUNITY_Drawer UI Component|Drawer UI Component]]
- [[_COMMUNITY_Sheet UI Component|Sheet UI Component]]
- [[_COMMUNITY_Combobox UI Component|Combobox UI Component]]
- [[_COMMUNITY_Pagination UI Component|Pagination UI Component]]
- [[_COMMUNITY_Onboarding Multi-step Flow|Onboarding Multi-step Flow]]
- [[_COMMUNITY_Dialog UI Component|Dialog UI Component]]
- [[_COMMUNITY_API Route Handlers|API Route Handlers]]
- [[_COMMUNITY_Carousel UI Component|Carousel UI Component]]
- [[_COMMUNITY_Table UI Component|Table UI Component]]
- [[_COMMUNITY_User Menu & Auth Header|User Menu & Auth Header]]
- [[_COMMUNITY_Alert Dialog Component|Alert Dialog Component]]
- [[_COMMUNITY_WhatsApp Baileys Integration|WhatsApp Baileys Integration]]
- [[_COMMUNITY_Google Login Page|Google Login Page]]
- [[_COMMUNITY_Calendar View Component|Calendar View Component]]
- [[_COMMUNITY_Avatar UI Component|Avatar UI Component]]
- [[_COMMUNITY_Calendar shadcn Component|Calendar shadcn Component]]
- [[_COMMUNITY_Card UI Component|Card UI Component]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_React Providers|React Providers]]
- [[_COMMUNITY_OAuth Callback Handler|OAuth Callback Handler]]
- [[_COMMUNITY_Dashboard Layout|Dashboard Layout]]
- [[_COMMUNITY_Calendar Page Loading|Calendar Page Loading]]
- [[_COMMUNITY_Calendar Dashboard Page|Calendar Dashboard Page]]
- [[_COMMUNITY_Clients Page Loading|Clients Page Loading]]
- [[_COMMUNITY_Clients Dashboard Page|Clients Dashboard Page]]
- [[_COMMUNITY_Client Profile Page|Client Profile Page]]
- [[_COMMUNITY_Finance Dashboard Page|Finance Dashboard Page]]
- [[_COMMUNITY_Services Dashboard Page|Services Dashboard Page]]
- [[_COMMUNITY_Settings Dashboard Page|Settings Dashboard Page]]
- [[_COMMUNITY_Appointment Dialog|Appointment Dialog]]
- [[_COMMUNITY_Calendar Header Component|Calendar Header Component]]
- [[_COMMUNITY_Week View Calendar|Week View Calendar]]
- [[_COMMUNITY_Client Profile Card|Client Profile Card]]
- [[_COMMUNITY_Finance Overview Component|Finance Overview Component]]
- [[_COMMUNITY_Bottom Navigation|Bottom Navigation]]
- [[_COMMUNITY_Dashboard Shell Layout|Dashboard Shell Layout]]
- [[_COMMUNITY_Luna Widget Component|Luna Widget Component]]
- [[_COMMUNITY_Badge UI Component|Badge UI Component]]
- [[_COMMUNITY_Button UI Component|Button UI Component]]
- [[_COMMUNITY_Input Group Component|Input Group Component]]
- [[_COMMUNITY_Input UI Component|Input UI Component]]
- [[_COMMUNITY_Label UI Component|Label UI Component]]
- [[_COMMUNITY_Separator UI Component|Separator UI Component]]
- [[_COMMUNITY_Skeleton UI Component|Skeleton UI Component]]
- [[_COMMUNITY_Spinner UI Component|Spinner UI Component]]
- [[_COMMUNITY_Textarea UI Component|Textarea UI Component]]
- [[_COMMUNITY_useClients Hook|useClients Hook]]
- [[_COMMUNITY_useFinance Hook|useFinance Hook]]
- [[_COMMUNITY_useGoogleCalendar Hook|useGoogleCalendar Hook]]
- [[_COMMUNITY_useLuna Hook|useLuna Hook]]
- [[_COMMUNITY_Luna AI Agent|Luna AI Agent]]
- [[_COMMUNITY_Supabase Browser Client|Supabase Browser Client]]
- [[_COMMUNITY_Supabase Server Client|Supabase Server Client]]
- [[_COMMUNITY_Supabase Admin Client|Supabase Admin Client]]
- [[_COMMUNITY_Utils (cn)|Utils (cn)]]
- [[_COMMUNITY_Next.js Types|Next.js Types]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_Dashboard Loading|Dashboard Loading]]
- [[_COMMUNITY_Dashboard Overview Page|Dashboard Overview Page]]
- [[_COMMUNITY_Day View Calendar|Day View Calendar]]
- [[_COMMUNITY_Month View Calendar|Month View Calendar]]
- [[_COMMUNITY_Client List Component|Client List Component]]
- [[_COMMUNITY_Dashboard UI Store|Dashboard UI Store]]
- [[_COMMUNITY_Luna UI Store|Luna UI Store]]
- [[_COMMUNITY_TypeScript Types|TypeScript Types]]
- [[_COMMUNITY_File SVG Asset|File SVG Asset]]
- [[_COMMUNITY_Globe SVG Asset|Globe SVG Asset]]
- [[_COMMUNITY_Next.js SVG Asset|Next.js SVG Asset]]
- [[_COMMUNITY_Vercel SVG Asset|Vercel SVG Asset]]
- [[_COMMUNITY_Window SVG Asset|Window SVG Asset]]

## God Nodes (most connected - your core abstractions)
1. `Auth + Onboarding Implementation Plan (2026-04-28)` - 11 edges
2. `CLAUDE.md â€” Ayumi Nails Project Spec` - 8 edges
3. `Auth + Onboarding Design Spec (2026-04-28)` - 8 edges
4. `POST()` - 4 edges
5. `Project Architecture â€” src/ directory structure` - 3 edges
6. `Availability Rules â€” 08:00â€“18:00 business hours constraint` - 3 edges
7. `Task 7: Update login page with real Google OAuth` - 3 edges
8. `DB Table: studio_profile (id, studio_name, owner_name, specialty, logo_url, onboarding_completed)` - 3 edges
9. `useCarousel()` - 2 edges
10. `CarouselNext()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Development Phases 1â€“11` --conceptually_related_to--> `Auth + Onboarding Implementation Plan (2026-04-28)`  [INFERRED]
  CLAUDE.md → docs/superpowers/plans/2026-04-28-auth-onboarding.md
- `Task 7: Update login page with real Google OAuth` --conceptually_related_to--> `Bellu App Icon â€” Stylized flower with pink/lilac petals, golden center, sparkles`  [INFERRED]
  docs/superpowers/plans/2026-04-28-auth-onboarding.md → src/assets/bellu_icon.svg
- `AGENTS.md â€” Next.js Agent Rules` --references--> `CLAUDE.md â€” Ayumi Nails Project Spec`  [INFERRED]
  AGENTS.md → CLAUDE.md
- `Task 7: Update login page with real Google OAuth` --references--> `Bellu Logo (PNG)`  [EXTRACTED]
  docs/superpowers/plans/2026-04-28-auth-onboarding.md → src/assets/logo-bellu.png
- `DB Tables: procedures, clients, bookings, working_hours, blocks, transactions, messages` --conceptually_related_to--> `Project Architecture â€” src/ directory structure`  [INFERRED]
  supabase/README.md → CLAUDE.md

## Hyperedges (group relationships)
- **Auth + Onboarding Feature â€” Spec, Plan, and DB Schema** — spec_auth_onboarding, plan_auth_onboarding, spec_studio_profile_table, spec_storage_bucket, spec_auth_flow, spec_middleware_rules, spec_onboarding_steps [EXTRACTED 1.00]
- **Luna Assistant System â€” WhatsApp bot + AI chatbot + availability rules** — claude_luna_whatsapp, claude_luna_chatbot, claude_availability_rules, supabase_booking_constraint [INFERRED 0.85]
- **Bellu Brand Assets â€” Icon and Logo** — img_bellu_icon, img_logo_bellu [INFERRED 0.90]
- **Next.js Default Public Assets** — img_public_file, img_public_globe, img_public_next, img_public_vercel, img_public_window [INFERRED 0.80]

## Communities

### Community 0 - "Auth Onboarding + Brand Assets"
Cohesion: 0.14
Nodes (19): Bellu App Icon â€” Stylized flower with pink/lilac petals, golden center, sparkles, Bellu Logo (PNG), Auth + Onboarding Implementation Plan (2026-04-28), Task 8: Create /api/studio route to save studio_profile, Task 1: Install @supabase/ssr, Task 7: Update login page with real Google OAuth, Task 6: Create src/middleware.ts route protection, Task 5: Create OAuth callback route /auth/callback (+11 more)

### Community 1 - "Project Spec & Luna Bot Rules"
Cohesion: 0.19
Nodes (13): AGENTS.md â€” Next.js Agent Rules, Project Architecture â€” src/ directory structure, Availability Rules â€” 08:00â€“18:00 business hours constraint, Dashboard V1 Scope â€” Calendar + Luna + Clients only, Luna â€” AI Dashboard Chatbot (Claude/Anthropic SDK), Luna â€” WhatsApp Bot (24h confirmation, 08-18h rule), Development Phases 1â€“11, CLAUDE.md â€” Ayumi Nails Project Spec (+5 more)

### Community 2 - "Select UI Component"
Cohesion: 0.2
Nodes (0): 

### Community 3 - "Google Calendar Integration"
Cohesion: 0.22
Nodes (2): createGoogleCalendarEvent(), updateGoogleCalendarEvent()

### Community 4 - "Drawer UI Component"
Cohesion: 0.22
Nodes (0): 

### Community 5 - "Sheet UI Component"
Cohesion: 0.25
Nodes (0): 

### Community 6 - "Combobox UI Component"
Cohesion: 0.29
Nodes (0): 

### Community 7 - "Pagination UI Component"
Cohesion: 0.29
Nodes (0): 

### Community 8 - "Onboarding Multi-step Flow"
Cohesion: 0.33
Nodes (0): 

### Community 9 - "Dialog UI Component"
Cohesion: 0.33
Nodes (0): 

### Community 10 - "API Route Handlers"
Cohesion: 0.4
Nodes (1): POST()

### Community 11 - "Carousel UI Component"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 12 - "Table UI Component"
Cohesion: 0.4
Nodes (0): 

### Community 13 - "User Menu & Auth Header"
Cohesion: 0.5
Nodes (0): 

### Community 14 - "Alert Dialog Component"
Cohesion: 0.5
Nodes (0): 

### Community 15 - "WhatsApp Baileys Integration"
Cohesion: 0.67
Nodes (2): createWhatsAppSession(), getWhatsAppSession()

### Community 16 - "Google Login Page"
Cohesion: 0.67
Nodes (0): 

### Community 17 - "Calendar View Component"
Cohesion: 0.67
Nodes (0): 

### Community 18 - "Avatar UI Component"
Cohesion: 0.67
Nodes (0): 

### Community 19 - "Calendar shadcn Component"
Cohesion: 0.67
Nodes (0): 

### Community 20 - "Card UI Component"
Cohesion: 0.67
Nodes (0): 

### Community 21 - "Auth Middleware"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Root Layout"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "React Providers"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "OAuth Callback Handler"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Dashboard Layout"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Calendar Page Loading"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Calendar Dashboard Page"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Clients Page Loading"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Clients Dashboard Page"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Client Profile Page"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Finance Dashboard Page"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Services Dashboard Page"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Settings Dashboard Page"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Appointment Dialog"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Calendar Header Component"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Week View Calendar"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Client Profile Card"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Finance Overview Component"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Bottom Navigation"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Dashboard Shell Layout"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Luna Widget Component"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Badge UI Component"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Button UI Component"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Input Group Component"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Input UI Component"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Label UI Component"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Separator UI Component"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Skeleton UI Component"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Spinner UI Component"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Textarea UI Component"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "useClients Hook"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "useFinance Hook"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "useGoogleCalendar Hook"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "useLuna Hook"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Luna AI Agent"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Supabase Browser Client"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Supabase Server Client"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Supabase Admin Client"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Utils (cn)"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Next.js Types"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Dashboard Loading"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Dashboard Overview Page"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Day View Calendar"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Month View Calendar"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Client List Component"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "Dashboard UI Store"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "Luna UI Store"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "TypeScript Types"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "File SVG Asset"
Cohesion: 1.0
Nodes (1): Public SVG: File icon (document/page graphic, gray)

### Community 71 - "Globe SVG Asset"
Cohesion: 1.0
Nodes (1): Public SVG: Globe icon (world/web, gray)

### Community 72 - "Next.js SVG Asset"
Cohesion: 1.0
Nodes (1): Public SVG: Next.js wordmark logo (black)

### Community 73 - "Vercel SVG Asset"
Cohesion: 1.0
Nodes (1): Public SVG: Vercel logo (white triangle)

### Community 74 - "Window SVG Asset"
Cohesion: 1.0
Nodes (1): Public SVG: Browser window icon (gray)

## Knowledge Gaps
- **12 isolated node(s):** `AGENTS.md â€” Next.js Agent Rules`, `Dashboard V1 Scope â€” Calendar + Luna + Clients only`, `Task 1: Install @supabase/ssr`, `Task 3: Add StudioProfile + Specialty types`, `Task 4: Create supabase-server.ts + supabase-browser.ts` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Auth Middleware`** (2 nodes): `middleware()`, `middleware.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Root Layout`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Providers`** (2 nodes): `Providers()`, `providers.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `OAuth Callback Handler`** (2 nodes): `GET()`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Layout`** (2 nodes): `DashboardLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Calendar Page Loading`** (2 nodes): `CalendarLoading()`, `loading.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Calendar Dashboard Page`** (2 nodes): `CalendarPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Clients Page Loading`** (2 nodes): `ClientsLoading()`, `loading.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Clients Dashboard Page`** (2 nodes): `ClientsPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Client Profile Page`** (2 nodes): `ClientProfilePage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Finance Dashboard Page`** (2 nodes): `FinancePage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Services Dashboard Page`** (2 nodes): `ServicesPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Settings Dashboard Page`** (2 nodes): `SettingsPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Appointment Dialog`** (2 nodes): `handleClientSelect()`, `appointment-dialog.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Calendar Header Component`** (2 nodes): `CalendarHeader()`, `calendar-header.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Week View Calendar`** (2 nodes): `week-view.tsx`, `getEventsForDay()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Client Profile Card`** (2 nodes): `ClientProfileCard()`, `client-profile.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Finance Overview Component`** (2 nodes): `FinanceOverview()`, `finance-overview.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Bottom Navigation`** (2 nodes): `BottomNav()`, `bottom-nav.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Shell Layout`** (2 nodes): `DashboardShell()`, `dashboard-shell.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Luna Widget Component`** (2 nodes): `LunaWidget()`, `luna-widget.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Badge UI Component`** (2 nodes): `Badge()`, `badge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Button UI Component`** (2 nodes): `cn()`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Input Group Component`** (2 nodes): `cn()`, `input-group.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Input UI Component`** (2 nodes): `Input()`, `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Label UI Component`** (2 nodes): `cn()`, `label.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Separator UI Component`** (2 nodes): `cn()`, `separator.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Skeleton UI Component`** (2 nodes): `Skeleton()`, `skeleton.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Spinner UI Component`** (2 nodes): `Spinner()`, `spinner.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Textarea UI Component`** (2 nodes): `textarea.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `useClients Hook`** (2 nodes): `useClients.ts`, `useClients()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `useFinance Hook`** (2 nodes): `useFinance.ts`, `useFinance()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `useGoogleCalendar Hook`** (2 nodes): `useGoogleCalendar.ts`, `useGoogleCalendar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `useLuna Hook`** (2 nodes): `useLuna.ts`, `useLuna()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Luna AI Agent`** (2 nodes): `sendLunaPrompt()`, `luna.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Supabase Browser Client`** (2 nodes): `supabase-browser.ts`, `createSupabaseBrowserClient()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Supabase Server Client`** (2 nodes): `supabase-server.ts`, `createSupabaseServerClient()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Supabase Admin Client`** (2 nodes): `supabase.ts`, `supabaseAdmin()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utils (cn)`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Types`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Loading`** (1 nodes): `loading.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Overview Page`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Day View Calendar`** (1 nodes): `day-view.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Month View Calendar`** (1 nodes): `month-view.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Client List Component`** (1 nodes): `client-list.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard UI Store`** (1 nodes): `dashboardUIStore.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Luna UI Store`** (1 nodes): `lunaUIStore.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TypeScript Types`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File SVG Asset`** (1 nodes): `Public SVG: File icon (document/page graphic, gray)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Globe SVG Asset`** (1 nodes): `Public SVG: Globe icon (world/web, gray)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js SVG Asset`** (1 nodes): `Public SVG: Next.js wordmark logo (black)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vercel SVG Asset`** (1 nodes): `Public SVG: Vercel logo (white triangle)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Window SVG Asset`** (1 nodes): `Public SVG: Browser window icon (gray)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Auth + Onboarding Implementation Plan (2026-04-28)` connect `Auth Onboarding + Brand Assets` to `Project Spec & Luna Bot Rules`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `Development Phases 1â€“11` connect `Project Spec & Luna Bot Rules` to `Auth Onboarding + Brand Assets`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Project Architecture â€” src/ directory structure` (e.g. with `Luna â€” AI Dashboard Chatbot (Claude/Anthropic SDK)` and `DB Tables: procedures, clients, bookings, working_hours, blocks, transactions, messages`) actually correct?**
  _`Project Architecture â€” src/ directory structure` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AGENTS.md â€” Next.js Agent Rules`, `Dashboard V1 Scope â€” Calendar + Luna + Clients only`, `Task 1: Install @supabase/ssr` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Onboarding + Brand Assets` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._