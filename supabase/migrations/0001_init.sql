-- Beauty Manager — schema inicial (Fase 1)
-- Extensões necessárias para UUID e exclusão de intervalos sobrepostos.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------------

create type public.professional_slug as enum ('ester', 'izabela');

create type public.appointment_status as enum (
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

create type public.payment_method as enum (
  'pix',
  'cash',
  'debit',
  'credit',
  'transfer',
  'other'
);

create type public.receivable_status as enum (
  'pending',
  'partial',
  'paid',
  'cancelled'
);

create type public.expense_responsibility as enum (
  'ester',
  'izabela',
  'shared'
);

create type public.expense_status as enum (
  'planned',
  'pending',
  'paid',
  'cancelled'
);

create type public.recurrence_interval as enum (
  'none',
  'weekly',
  'monthly',
  'yearly'
);

create type public.return_status as enum (
  'upcoming',
  'near',
  'overdue',
  'scheduled',
  'completed',
  'dismissed'
);

create type public.financial_basis as enum ('accrual', 'cash');

-- ---------------------------------------------------------------------------
-- Função de updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profissionais (identidades da clínica — não são contas de login)
-- ---------------------------------------------------------------------------

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  slug public.professional_slug not null unique,
  display_name text not null,
  short_name text not null,
  accent_color text not null,
  instagram_handle text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger professionals_set_updated_at
before update on public.professionals
for each row execute function public.set_updated_at();

insert into public.professionals (slug, display_name, short_name, accent_color, instagram_handle)
values
  ('ester', 'Ester', 'Ester', '#B66F8B', 'BeautyByEsterr'),
  ('izabela', 'Dra. Izabela', 'Izabela', '#C5A06A', null);

-- ---------------------------------------------------------------------------
-- Perfis ligados ao Auth
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  professional_id uuid not null unique references public.professionals (id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Configuração societária / clínica (registro único)
-- ---------------------------------------------------------------------------

create table public.business_settings (
  id smallint primary key default 1 check (id = 1),
  clinic_name text not null default 'Beauty Manager',
  ester_share_bps integer not null default 5000 check (ester_share_bps >= 0),
  izabela_share_bps integer not null default 5000 check (izabela_share_bps >= 0),
  cash_reserve_cents bigint not null default 0 check (cash_reserve_cents >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_settings_shares_total_chk
    check (ester_share_bps + izabela_share_bps = 10000)
);

create trigger business_settings_set_updated_at
before update on public.business_settings
for each row execute function public.set_updated_at();

insert into public.business_settings (id, clinic_name)
values (1, 'Beauty Manager');

-- ---------------------------------------------------------------------------
-- Salas
-- ---------------------------------------------------------------------------

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger rooms_set_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

insert into public.rooms (name) values ('Sala 1'), ('Sala 2');

-- ---------------------------------------------------------------------------
-- Clientes (dados pessoais minimizados — sem prontuário clínico)
-- ---------------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  phone_normalized text not null,
  birth_date date,
  reference_professional_id uuid references public.professionals (id),
  notes text,
  contact_consent boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_phone_normalized_chk check (phone_normalized ~ '^[0-9]{10,13}$')
);

create unique index clients_phone_normalized_uidx
  on public.clients (phone_normalized)
  where is_active = true;

create index clients_full_name_idx on public.clients (full_name);
create index clients_reference_professional_idx on public.clients (reference_professional_id);

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Procedimentos
-- ---------------------------------------------------------------------------

create table public.procedures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_description text,
  category text not null,
  default_price_cents bigint not null check (default_price_cents >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  suggested_return_days integer check (suggested_return_days is null or suggested_return_days > 0),
  requires_return_confirmation boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.procedure_professionals (
  procedure_id uuid not null references public.procedures (id) on delete cascade,
  professional_id uuid not null references public.professionals (id) on delete cascade,
  primary key (procedure_id, professional_id)
);

create trigger procedures_set_updated_at
before update on public.procedures
for each row execute function public.set_updated_at();

create index procedures_category_idx on public.procedures (category);
create index procedures_active_idx on public.procedures (is_active);

-- ---------------------------------------------------------------------------
-- Agenda
-- ---------------------------------------------------------------------------

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id),
  professional_id uuid not null references public.professionals (id),
  procedure_id uuid not null references public.procedures (id),
  room_id uuid references public.rooms (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  expected_amount_cents bigint not null check (expected_amount_cents >= 0),
  status public.appointment_status not null default 'scheduled',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_range_chk check (ends_at > starts_at)
);

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create index appointments_professional_starts_idx
  on public.appointments (professional_id, starts_at);

create index appointments_room_starts_idx
  on public.appointments (room_id, starts_at);

create index appointments_client_idx on public.appointments (client_id);

-- Conflitos de horário da profissional (exceto cancelado / não compareceu)
alter table public.appointments
  add constraint appointments_professional_no_overlap
  exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status not in ('cancelled', 'no_show'));

-- Conflitos de sala (quando sala informada)
alter table public.appointments
  add constraint appointments_room_no_overlap
  exclude using gist (
    room_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (room_id is not null and status not in ('cancelled', 'no_show'));

-- Observações administrativas privadas (não vazam na agenda cruzada)
create table public.appointment_private_notes (
  appointment_id uuid primary key references public.appointments (id) on delete cascade,
  professional_id uuid not null references public.professionals (id),
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger appointment_private_notes_set_updated_at
before update on public.appointment_private_notes
for each row execute function public.set_updated_at();

create table public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  from_status public.appointment_status,
  to_status public.appointment_status not null,
  changed_by uuid references public.profiles (id),
  changed_at timestamptz not null default now(),
  note text
);

create index appointment_status_history_appt_idx
  on public.appointment_status_history (appointment_id, changed_at desc);

-- ---------------------------------------------------------------------------
-- Atendimentos concluídos (snapshot financeiro do serviço)
-- ---------------------------------------------------------------------------

create table public.service_records (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid unique references public.appointments (id),
  client_id uuid not null references public.clients (id),
  professional_id uuid not null references public.professionals (id),
  procedure_id uuid not null references public.procedures (id),
  procedure_name_snapshot text not null,
  performed_at timestamptz not null,
  amount_cents bigint not null check (amount_cents >= 0),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index service_records_professional_performed_idx
  on public.service_records (professional_id, performed_at);

-- ---------------------------------------------------------------------------
-- Retornos
-- ---------------------------------------------------------------------------

create table public.return_reminders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id),
  professional_id uuid not null references public.professionals (id),
  service_record_id uuid references public.service_records (id),
  procedure_id uuid references public.procedures (id),
  last_service_at timestamptz not null,
  suggested_return_on date not null,
  status public.return_status not null default 'upcoming',
  contact_authorized boolean not null default false,
  last_contacted_at timestamptz,
  linked_appointment_id uuid references public.appointments (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger return_reminders_set_updated_at
before update on public.return_reminders
for each row execute function public.set_updated_at();

create index return_reminders_status_date_idx
  on public.return_reminders (status, suggested_return_on);

create index return_reminders_professional_idx
  on public.return_reminders (professional_id, suggested_return_on);

-- ---------------------------------------------------------------------------
-- Financeiro — receitas e pagamentos (valores em centavos)
-- ---------------------------------------------------------------------------

create table public.receivables (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals (id),
  client_id uuid references public.clients (id),
  service_record_id uuid unique references public.service_records (id),
  description text not null,
  competence_date date not null,
  amount_cents bigint not null check (amount_cents >= 0),
  status public.receivable_status not null default 'pending',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger receivables_set_updated_at
before update on public.receivables
for each row execute function public.set_updated_at();

create index receivables_professional_competence_idx
  on public.receivables (professional_id, competence_date);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  receivable_id uuid not null references public.receivables (id),
  professional_id uuid not null references public.professionals (id),
  amount_cents bigint not null check (amount_cents > 0),
  paid_at date not null,
  method public.payment_method not null,
  notes text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index payments_receivable_idx on public.payments (receivable_id);
create index payments_professional_paid_idx on public.payments (professional_id, paid_at);

create or replace function public.enforce_payment_not_over_receivable()
returns trigger
language plpgsql
as $$
declare
  receivable_amount bigint;
  paid_total bigint;
begin
  select amount_cents into receivable_amount
  from public.receivables
  where id = new.receivable_id
  for update;

  select coalesce(sum(amount_cents), 0) into paid_total
  from public.payments
  where receivable_id = new.receivable_id
    and (tg_op = 'INSERT' or id <> new.id);

  if paid_total + new.amount_cents > receivable_amount then
    raise exception 'Pagamento excede o valor da receita';
  end if;

  return new;
end;
$$;

create trigger payments_enforce_amount
before insert or update of amount_cents, receivable_id
on public.payments
for each row execute function public.enforce_payment_not_over_receivable();

create or replace function public.sync_receivable_status()
returns trigger
language plpgsql
as $$
declare
  target uuid;
  receivable_amount bigint;
  paid_total bigint;
  current_status public.receivable_status;
begin
  target := coalesce(new.receivable_id, old.receivable_id);

  select amount_cents, status into receivable_amount, current_status
  from public.receivables
  where id = target
  for update;

  if current_status = 'cancelled' then
    return coalesce(new, old);
  end if;

  select coalesce(sum(amount_cents), 0) into paid_total
  from public.payments
  where receivable_id = target;

  update public.receivables
  set status = case
    when paid_total = 0 then 'pending'::public.receivable_status
    when paid_total < receivable_amount then 'partial'::public.receivable_status
    else 'paid'::public.receivable_status
  end
  where id = target
    and status <> 'cancelled';

  return coalesce(new, old);
end;
$$;

create trigger payments_sync_receivable_status
after insert or update or delete
on public.payments
for each row execute function public.sync_receivable_status();

-- ---------------------------------------------------------------------------
-- Despesas
-- ---------------------------------------------------------------------------

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.expense_categories (name) values
  ('Aluguel'),
  ('Energia elétrica'),
  ('Água'),
  ('Internet'),
  ('Limpeza'),
  ('Materiais comuns'),
  ('Serviços administrativos'),
  ('Insumos individuais'),
  ('Produtos de procedimento'),
  ('Outros');

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category_id uuid not null references public.expense_categories (id),
  amount_cents bigint not null check (amount_cents > 0),
  competence_date date not null,
  due_date date,
  paid_at date,
  responsibility public.expense_responsibility not null,
  payment_method public.payment_method,
  status public.expense_status not null default 'pending',
  recurrence public.recurrence_interval not null default 'none',
  recurrence_group_id uuid,
  notes text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_paid_status_chk check (
    (status = 'paid' and paid_at is not null)
    or (status <> 'paid')
  )
);

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

create unique index expenses_recurrence_instance_uidx
  on public.expenses (recurrence_group_id, competence_date)
  where recurrence_group_id is not null and status <> 'cancelled';

create index expenses_responsibility_competence_idx
  on public.expenses (responsibility, competence_date);

-- ---------------------------------------------------------------------------
-- Distribuição de lucros (estimativa gerencial)
-- ---------------------------------------------------------------------------

create table public.profit_distributions (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  basis public.financial_basis not null default 'accrual',
  estimated_result_cents bigint not null,
  tax_adjustment_cents bigint not null default 0,
  reserve_cents bigint not null default 0,
  other_adjustments_cents bigint not null default 0,
  distributable_cents bigint not null,
  ester_share_bps integer not null,
  izabela_share_bps integer not null,
  ester_amount_cents bigint not null,
  izabela_amount_cents bigint not null,
  is_executed boolean not null default false,
  executed_at date,
  notes text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint profit_distributions_period_chk check (period_end >= period_start),
  constraint profit_distributions_shares_chk check (ester_share_bps + izabela_share_bps = 10000)
);

create unique index profit_distributions_period_basis_uidx
  on public.profit_distributions (period_start, period_end, basis)
  where is_executed = true;

-- ---------------------------------------------------------------------------
-- Auditoria
-- ---------------------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

create or replace function public.write_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
$$;
