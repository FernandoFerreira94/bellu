-- ============================================================
-- Row Level Security — Ayumi Nails
-- ============================================================

-- Habilitar RLS em todas as tabelas
alter table public.procedures    enable row level security;
alter table public.clients       enable row level security;
alter table public.working_hours enable row level security;
alter table public.bookings      enable row level security;
alter table public.blocks        enable row level security;
alter table public.transactions  enable row level security;
alter table public.messages      enable row level security;

-- ============================================================
-- PROCEDURES: leitura pública, escrita só admin
-- ============================================================
create policy "procedures_public_read"
  on public.procedures for select
  using (active = true);

create policy "procedures_admin_all"
  on public.procedures for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- CLIENTS: só admin
-- ============================================================
create policy "clients_admin_all"
  on public.clients for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- WORKING HOURS: leitura pública (para calcular disponibilidade)
-- ============================================================
create policy "working_hours_public_read"
  on public.working_hours for select
  using (true);

create policy "working_hours_admin_write"
  on public.working_hours for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- BOOKINGS: insert público (cliente agenda), resto admin
-- ============================================================
create policy "bookings_public_insert"
  on public.bookings for insert
  with check (true);

create policy "bookings_admin_all"
  on public.bookings for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- BLOCKS: leitura pública (disponibilidade), escrita admin
-- ============================================================
create policy "blocks_public_read"
  on public.blocks for select
  using (true);

create policy "blocks_admin_all"
  on public.blocks for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- TRANSACTIONS: só admin
-- ============================================================
create policy "transactions_admin_all"
  on public.transactions for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- MESSAGES: só admin
-- ============================================================
create policy "messages_admin_all"
  on public.messages for all
  using (auth.role() = 'authenticated');
