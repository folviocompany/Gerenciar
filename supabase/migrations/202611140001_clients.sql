begin;

-- Nomes profissionais são necessários nos filtros compartilhados da clínica.
drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_member on public.profiles for select to authenticated
using ((select public.is_active_member()));

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 2 and 150),
  phone_digits text not null check (phone_digits ~ '^\d{10,13}$'),
  birth_date date check (birth_date <= current_date),
  reference_professional_id uuid references public.professionals(id) on delete set null,
  notes text check (length(notes) <= 1000),
  whatsapp_allowed boolean not null default false,
  active boolean not null default true,
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  updated_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index clients_name_phone_unique_idx on public.clients (lower(trim(full_name)), phone_digits);
create index clients_name_search_idx on public.clients (lower(full_name));
create index clients_phone_search_idx on public.clients (phone_digits);
create index clients_reference_professional_idx on public.clients (reference_professional_id) where active;

create function public.set_client_audit_fields() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = auth.uid();
  end if;
  new.updated_by = auth.uid();
  new.updated_at = now();
  return new;
end; $$;
revoke all on function public.set_client_audit_fields() from public;

alter table public.clients enable row level security;
revoke all on public.clients from anon, authenticated;
grant select on public.clients to authenticated;
grant insert (full_name, phone_digits, birth_date, reference_professional_id, notes, whatsapp_allowed, active) on public.clients to authenticated;
grant update (full_name, phone_digits, birth_date, reference_professional_id, notes, whatsapp_allowed, active) on public.clients to authenticated;

create policy clients_read_member on public.clients for select to authenticated
using ((select public.is_active_member()));
create policy clients_insert_member on public.clients for insert to authenticated
with check ((select public.is_active_member()));
create policy clients_update_member on public.clients for update to authenticated
using ((select public.is_active_member()))
with check ((select public.is_active_member()));

create trigger clients_audit_fields before insert or update on public.clients
for each row execute function public.set_client_audit_fields();
create trigger clients_audit after insert or update or delete on public.clients
for each row execute function public.audit_change();

commit;
