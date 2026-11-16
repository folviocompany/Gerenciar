begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (length(trim(display_name)) between 1 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete restrict,
  specialty text not null check (length(trim(specialty)) between 1 and 120),
  color text not null default '#B66F8B' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.procedures (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 120),
  description text check (length(description) <= 500),
  category text not null check (length(trim(category)) between 1 and 80),
  price_cents bigint not null default 0 check (price_cents between 0 and 999999999),
  duration_minutes integer not null check (duration_minutes between 5 and 1440),
  return_interval_days integer check (return_interval_days between 1 and 3650),
  requires_return_confirmation boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index procedures_owner_name_idx on public.procedures (professional_id, lower(trim(name)));
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.business_settings (
  id integer primary key default 1 check (id = 1),
  name text not null default 'rocheclinic',
  timezone text not null default 'America/Manaus',
  currency text not null default 'BRL' check (currency = 'BRL'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.business_settings (id) values (1);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  created_at timestamptz not null default now()
);
create index audit_logs_actor_created_idx on public.audit_logs (actor_id, created_at desc);

-- Membership is provisioned administratively, never from user_metadata or sign-up.
create function public.is_active_member() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and active); $$;
revoke all on function public.is_active_member() from public;
grant execute on function public.is_active_member() to authenticated;

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create function public.audit_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs (actor_id, table_name, record_id, action)
  values (auth.uid(), tg_table_name, coalesce(new.id::text, old.id::text), tg_op);
  return coalesce(new, old);
end; $$;
revoke all on function public.audit_change() from public;
revoke all on function public.set_updated_at() from public;

alter table public.profiles enable row level security;
alter table public.professionals enable row level security;
alter table public.procedures enable row level security;
alter table public.rooms enable row level security;
alter table public.business_settings enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.profiles, public.professionals, public.procedures, public.rooms, public.business_settings, public.audit_logs from anon, authenticated;
grant select on public.profiles, public.professionals, public.rooms, public.business_settings, public.audit_logs to authenticated;
grant select, insert on public.procedures to authenticated;
-- Ownership, ids and timestamps cannot be reassigned by application users.
grant update (name, description, category, price_cents, duration_minutes, return_interval_days, requires_return_confirmation, active) on public.procedures to authenticated;

create policy profiles_read_own on public.profiles for select to authenticated
using (id = (select auth.uid()) and (select public.is_active_member()));
-- Non-sensitive professional metadata supports cross-professional scheduling later.
create policy professionals_read_member on public.professionals for select to authenticated
using ((select public.is_active_member()));
create policy procedures_read_own on public.procedures for select to authenticated
using ((select public.is_active_member()) and professional_id in (select id from public.professionals where user_id = (select auth.uid())));
create policy procedures_insert_own on public.procedures for insert to authenticated
with check ((select public.is_active_member()) and professional_id in (select id from public.professionals where user_id = (select auth.uid())));
create policy procedures_update_own on public.procedures for update to authenticated
using ((select public.is_active_member()) and professional_id in (select id from public.professionals where user_id = (select auth.uid())))
with check ((select public.is_active_member()) and professional_id in (select id from public.professionals where user_id = (select auth.uid())));
create policy rooms_read_member on public.rooms for select to authenticated using ((select public.is_active_member()));
create policy business_read_member on public.business_settings for select to authenticated using ((select public.is_active_member()));
create policy audit_read_own on public.audit_logs for select to authenticated using (actor_id = (select auth.uid()) and (select public.is_active_member()));

create trigger profiles_timestamp before update on public.profiles for each row execute function public.set_updated_at();
create trigger professionals_timestamp before update on public.professionals for each row execute function public.set_updated_at();
create trigger procedures_timestamp before update on public.procedures for each row execute function public.set_updated_at();
create trigger rooms_timestamp before update on public.rooms for each row execute function public.set_updated_at();
create trigger business_timestamp before update on public.business_settings for each row execute function public.set_updated_at();
create trigger profiles_audit after insert or update or delete on public.profiles for each row execute function public.audit_change();
create trigger professionals_audit after insert or update or delete on public.professionals for each row execute function public.audit_change();
create trigger procedures_audit after insert or update or delete on public.procedures for each row execute function public.audit_change();
create trigger rooms_audit after insert or update or delete on public.rooms for each row execute function public.audit_change();
create trigger business_audit after insert or update or delete on public.business_settings for each row execute function public.audit_change();
commit;
