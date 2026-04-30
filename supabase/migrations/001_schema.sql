-- ============================================================
-- Ayumi Nails — Schema Completo
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: procedures (procedimentos/serviços)
-- ============================================================
create table public.procedures (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  duration    integer not null check (duration > 0),  -- minutos
  price       numeric(10,2) not null check (price >= 0),
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- TABELA: clients (clientes)
-- ============================================================
create table public.clients (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  phone      text not null unique,
  email      text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TABELA: working_hours (horário de funcionamento)
-- ============================================================
create table public.working_hours (
  id           uuid primary key default uuid_generate_v4(),
  day_of_week  integer not null check (day_of_week between 0 and 6), -- 0=Dom, 6=Sáb
  start_time   time not null default '08:00',
  end_time     time not null default '19:00',
  active       boolean not null default true,
  constraint working_hours_day_unique unique (day_of_week),
  constraint working_hours_time_check check (
    start_time >= '08:00' and end_time <= '19:00' and start_time < end_time
  )
);

-- ============================================================
-- TABELA: bookings (agendamentos)
-- ============================================================
create table public.bookings (
  id               uuid primary key default uuid_generate_v4(),
  client_id        uuid not null references public.clients(id) on delete restrict,
  procedure_id     uuid not null references public.procedures(id) on delete restrict,
  start_time       timestamptz not null,
  end_time         timestamptz not null,
  status           text not null default 'confirmed'
                   check (status in ('pending','confirmed','cancelled','completed')),
  google_event_id  text,
  payment_status   text default 'pending'
                   check (payment_status in ('pending','paid','refunded')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint bookings_time_order check (start_time < end_time),
  constraint bookings_within_hours check (
    extract(hour from start_time at time zone 'America/Sao_Paulo') >= 8 and
    extract(hour from end_time at time zone 'America/Sao_Paulo') <= 19
  )
);

-- ============================================================
-- TABELA: blocks (bloqueios / eventos Google Calendar)
-- ============================================================
create table public.blocks (
  id              uuid primary key default uuid_generate_v4(),
  start_time      timestamptz not null,
  end_time        timestamptz not null,
  reason          text,
  google_event_id text,
  created_at      timestamptz not null default now(),
  constraint blocks_time_order check (start_time < end_time)
);

-- ============================================================
-- TABELA: transactions (financeiro)
-- ============================================================
create table public.transactions (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid references public.bookings(id) on delete set null,
  type        text not null check (type in ('income','expense')),
  amount      numeric(10,2) not null check (amount > 0),
  description text not null,
  date        date not null default current_date,
  payment_method text check (payment_method in ('pix','cash','credit','debit','mp')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TABELA: messages (log WhatsApp Luna)
-- ============================================================
create table public.messages (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid references public.bookings(id) on delete set null,
  client_id   uuid references public.clients(id) on delete set null,
  phone       text not null,
  content     text not null,
  direction   text not null check (direction in ('outbound','inbound')),
  status      text not null default 'pending'
              check (status in ('pending','sent','delivered','failed')),
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_bookings_start_time    on public.bookings(start_time);
create index idx_bookings_client_id     on public.bookings(client_id);
create index idx_bookings_status        on public.bookings(status);
create index idx_bookings_google_event  on public.bookings(google_event_id) where google_event_id is not null;
create index idx_clients_phone          on public.clients(phone);
create index idx_blocks_start_time      on public.blocks(start_time);
create index idx_transactions_date      on public.transactions(date);
create index idx_messages_booking_id    on public.messages(booking_id);
create index idx_messages_status        on public.messages(status);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_procedures_updated_at
  before update on public.procedures
  for each row execute function public.set_updated_at();

create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create trigger trg_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();
