# Módulo de Agendamento — Plano

**Data:** 2026-04-28
**Status:** Planejado — aguardando implementação

---

## Objetivo

Permitir que a nail designer visualize e gerencie agendamentos no dashboard (calendário semanal/diário), com lógica de slots disponíveis respeitando 08:00–18:00.

---

## Arquitetura

### Fonte da verdade
- Tabela `bookings` no Supabase (agendamentos manuais e futuros do Google Calendar)
- Google Calendar como espelho (fase posterior — write)

### Tabela `bookings` (verificar colunas reais antes de implementar)
Esperado: id, client_id, procedure_id, start_at, end_at, status, notes, created_at

---

## Fases do módulo

### Fase A — Lógica de slots (lib)
`src/lib/availability.ts`
- Função `getAvailableSlots(date, procedureDuration, bookings, workingHours)`
- Respeita 08:00–18:00 (working_hours)
- Desconta duração do procedimento + buffer (configurável)
- Antecedência mínima: 2h
- Retorna array de `{ start: Date, end: Date }`

### Fase B — Hook de dados
`src/hooks/useBookings.ts`
- `useBookings(dateRange)` → lista bookings do período
- `useCreateBooking()` → insere booking + toast
- `useUpdateBooking()` → atualiza status/dados
- `useCancelBooking()` → soft-delete (status = cancelled)

### Fase C — Calendário visual (dashboard)
`src/components/calendar/`
- `WeekView` — grade 7 dias, slots de 30min, eventos coloridos por procedure
- `DayView` — detalhe do dia, lista de agendamentos
- Navegação: semana anterior/próxima
- Mobile-first: DayView por padrão no mobile, WeekView opcional
- Clicar em slot vazio → Sheet de novo agendamento
- Clicar em agendamento → Sheet de detalhes/editar

### Fase D — Sheet de agendamento
`src/components/calendar/booking-sheet.tsx`
- Campos: cliente (combobox com busca), serviço (select), data, horário (slots disponíveis)
- Validação: horário dentro do expediente, sem conflito
- Salva em `bookings`

---

## Componentes reutilizáveis
- `Sheet` (bottom) — já usado em clients e services
- `Combobox` — já existe em `src/components/ui/combobox.tsx`
- `Avatar` + `Badge` — já usados

---

## Ordem de implementação
1. Verificar schema real de `bookings` via MCP Supabase
2. `useBookings` hook
3. `availability.ts` lógica de slots
4. `WeekView` / `DayView` componentes
5. `BookingSheet` — form de criação
6. Integrar na page `/dashboard/calendar`
