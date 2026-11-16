begin;

create table public.receivables (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete restrict,
  client_id uuid references public.clients(id) on delete set null,
  procedure_id uuid references public.procedures(id) on delete set null,
  description text not null check (length(trim(description)) between 2 and 180),
  amount_cents bigint not null check (amount_cents between 1 and 999999999),
  service_date date not null,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'partially_paid', 'paid', 'cancelled')),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  updated_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  receivable_id uuid not null references public.receivables(id) on delete restrict,
  amount_cents bigint not null check (amount_cents between 1 and 999999999),
  paid_at date not null,
  payment_method text not null check (payment_method in ('pix', 'cash', 'debit_card', 'credit_card', 'transfer', 'other')),
  notes text check (length(notes) <= 300),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null check (length(trim(description)) between 2 and 180),
  category text not null check (length(trim(category)) between 2 and 80),
  amount_cents bigint not null check (amount_cents between 1 and 999999999),
  competence_date date not null,
  due_date date not null,
  paid_at date,
  responsibility text not null check (responsibility in ('individual', 'shared')),
  professional_id uuid references public.professionals(id) on delete restrict,
  payment_method text check (payment_method in ('pix', 'cash', 'debit_card', 'credit_card', 'transfer', 'other')),
  status text not null default 'pending' check (status in ('planned', 'pending', 'paid', 'cancelled')),
  notes text check (length(notes) <= 500),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  updated_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_responsibility_owner check (
    (responsibility = 'shared' and professional_id is null) or
    (responsibility = 'individual' and professional_id is not null)
  ),
  constraint expenses_paid_fields check (
    (status = 'paid' and paid_at is not null and payment_method is not null) or
    (status <> 'paid' and paid_at is null)
  )
);

create index receivables_professional_service_idx on public.receivables (professional_id, service_date desc) where status <> 'cancelled';
create index receivables_due_status_idx on public.receivables (due_date, status);
create index payments_paid_at_idx on public.payments (paid_at desc);
create index payments_receivable_idx on public.payments (receivable_id);
create index expenses_competence_idx on public.expenses (competence_date desc) where status <> 'cancelled';
create index expenses_paid_at_idx on public.expenses (paid_at desc) where status = 'paid';
create index expenses_professional_idx on public.expenses (professional_id, competence_date desc);

create function public.own_professional_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.professionals
  where user_id = (select auth.uid()) and (select public.is_active_member())
  limit 1;
$$;
revoke all on function public.own_professional_id() from public;
grant execute on function public.own_professional_id() to authenticated;

create function public.set_financial_audit_fields() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then new.created_by = auth.uid(); end if;
  new.updated_by = auth.uid();
  new.updated_at = now();
  return new;
end; $$;
revoke all on function public.set_financial_audit_fields() from public;

create function public.validate_payment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  total_due bigint;
  current_paid bigint;
  owner_id uuid;
  current_status text;
begin
  select r.amount_cents, r.professional_id, r.status
    into total_due, owner_id, current_status
  from public.receivables r where r.id = new.receivable_id for update;
  if not found then raise exception 'Recebível não encontrado'; end if;
  if owner_id <> public.own_professional_id() then raise exception 'Pagamento não autorizado'; end if;
  if current_status = 'cancelled' then raise exception 'Recebível cancelado'; end if;
  select coalesce(sum(p.amount_cents), 0) into current_paid from public.payments p where p.receivable_id = new.receivable_id;
  if current_paid + new.amount_cents > total_due then raise exception 'Pagamento excede o saldo devido'; end if;
  new.created_by = auth.uid();
  return new;
end; $$;
revoke all on function public.validate_payment() from public;

create function public.refresh_receivable_status() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  paid bigint;
  total bigint;
begin
  select r.amount_cents into total from public.receivables r where r.id = new.receivable_id;
  select coalesce(sum(p.amount_cents), 0) into paid from public.payments p where p.receivable_id = new.receivable_id;
  update public.receivables
  set status = case when paid = 0 then 'pending' when paid < total then 'partially_paid' else 'paid' end,
      updated_by = auth.uid(), updated_at = now()
  where id = new.receivable_id and status <> 'cancelled';
  return new;
end; $$;
revoke all on function public.refresh_receivable_status() from public;

alter table public.receivables enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
revoke all on public.receivables, public.payments, public.expenses from anon, authenticated;
grant select on public.receivables, public.payments, public.expenses to authenticated;
grant insert (professional_id, client_id, procedure_id, description, amount_cents, service_date, due_date, status) on public.receivables to authenticated;
grant update (client_id, procedure_id, description, amount_cents, service_date, due_date, status) on public.receivables to authenticated;
grant insert (receivable_id, amount_cents, paid_at, payment_method, notes) on public.payments to authenticated;
grant insert (description, category, amount_cents, competence_date, due_date, paid_at, responsibility, professional_id, payment_method, status, notes) on public.expenses to authenticated;
grant update (description, category, amount_cents, competence_date, due_date, paid_at, responsibility, professional_id, payment_method, status, notes) on public.expenses to authenticated;

create policy receivables_read_member on public.receivables for select to authenticated using ((select public.is_active_member()));
create policy receivables_insert_own on public.receivables for insert to authenticated with check ((select public.is_active_member()) and professional_id = (select public.own_professional_id()));
create policy receivables_update_own on public.receivables for update to authenticated using (professional_id = (select public.own_professional_id())) with check (professional_id = (select public.own_professional_id()));
create policy payments_read_member on public.payments for select to authenticated using ((select public.is_active_member()));
create policy payments_insert_own on public.payments for insert to authenticated with check (exists (select 1 from public.receivables r where r.id = receivable_id and r.professional_id = (select public.own_professional_id())));
create policy expenses_read_member on public.expenses for select to authenticated using ((select public.is_active_member()));
create policy expenses_insert_allowed on public.expenses for insert to authenticated with check ((select public.is_active_member()) and (responsibility = 'shared' or professional_id = (select public.own_professional_id())));
create policy expenses_update_creator on public.expenses for update to authenticated using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()) and (responsibility = 'shared' or professional_id = (select public.own_professional_id())));

create trigger receivables_audit_fields before insert or update on public.receivables for each row execute function public.set_financial_audit_fields();
create trigger expenses_audit_fields before insert or update on public.expenses for each row execute function public.set_financial_audit_fields();
create trigger payments_validate before insert on public.payments for each row execute function public.validate_payment();
create trigger payments_refresh_status after insert on public.payments for each row execute function public.refresh_receivable_status();
create trigger receivables_audit after insert or update or delete on public.receivables for each row execute function public.audit_change();
create trigger payments_audit after insert or update or delete on public.payments for each row execute function public.audit_change();
create trigger expenses_audit after insert or update or delete on public.expenses for each row execute function public.audit_change();

create function public.register_receivable(
  p_description text, p_amount_cents bigint, p_service_date date, p_due_date date,
  p_client_id uuid, p_procedure_id uuid, p_initial_payment_cents bigint,
  p_payment_method text, p_paid_at date
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  new_id uuid;
  own_prof_id uuid;
begin
  own_prof_id := public.own_professional_id();
  if own_prof_id is null then raise exception 'Profissional não autorizada'; end if;
  if p_amount_cents < 1 or p_initial_payment_cents < 0 or p_initial_payment_cents > p_amount_cents then raise exception 'Valores inválidos'; end if;
  if p_initial_payment_cents > 0 and (p_payment_method is null or p_paid_at is null) then raise exception 'Dados do pagamento incompletos'; end if;
  if p_procedure_id is not null and not exists (select 1 from public.procedures where id = p_procedure_id and professional_id = own_prof_id) then raise exception 'Procedimento inválido'; end if;
  if p_client_id is not null and not exists (select 1 from public.clients where id = p_client_id and active) then raise exception 'Cliente inválida'; end if;
  insert into public.receivables (professional_id, client_id, procedure_id, description, amount_cents, service_date, due_date)
  values (own_prof_id, p_client_id, p_procedure_id, trim(p_description), p_amount_cents, p_service_date, p_due_date) returning id into new_id;
  if p_initial_payment_cents > 0 then
    insert into public.payments (receivable_id, amount_cents, paid_at, payment_method)
    values (new_id, p_initial_payment_cents, p_paid_at, p_payment_method);
  end if;
  return new_id;
end; $$;
revoke all on function public.register_receivable(text,bigint,date,date,uuid,uuid,bigint,text,date) from public;
grant execute on function public.register_receivable(text,bigint,date,date,uuid,uuid,bigint,text,date) to authenticated;

commit;
