-- Beauty Manager — RLS, helpers de autorização e visão de agenda compartilhada.

-- ---------------------------------------------------------------------------
-- Helpers (security definer, search_path fixo, sem recursão de RLS)
-- ---------------------------------------------------------------------------

create or replace function public.is_partner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active = true
  );
$$;

create or replace function public.current_professional_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.professional_id
  from public.profiles as p
  where p.id = auth.uid()
    and p.is_active = true;
$$;

create or replace function public.current_professional_slug()
returns public.professional_slug
language sql
stable
security definer
set search_path = public
as $$
  select pr.slug
  from public.profiles as p
  inner join public.professionals as pr on pr.id = p.professional_id
  where p.id = auth.uid()
    and p.is_active = true;
$$;

create or replace function public.protect_profile_identity()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.professional_id is distinct from old.professional_id
     or new.is_active is distinct from old.is_active
     or new.id is distinct from old.id then
    raise exception 'Alteração de identidade do perfil não permitida';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_identity
before update on public.profiles
for each row execute function public.protect_profile_identity();

revoke all on function public.is_partner() from public, anon;
revoke all on function public.current_professional_id() from public, anon;
revoke all on function public.current_professional_slug() from public, anon;
revoke all on function public.write_audit_log(text, text, uuid, jsonb) from public, anon;

grant execute on function public.is_partner() to authenticated;
grant execute on function public.current_professional_id() to authenticated;
grant execute on function public.current_professional_slug() to authenticated;
grant execute on function public.write_audit_log(text, text, uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Visões de agenda
-- Owner da view ignora RLS da tabela; current_professional_id() aplica o recorte.
-- authenticated não recebe SELECT direto em appointments (evita vazar cliente/valor).
-- ---------------------------------------------------------------------------

create view public.appointment_board as
select
  a.id,
  a.professional_id,
  a.procedure_id,
  a.room_id,
  a.starts_at,
  a.ends_at,
  a.status,
  case
    when a.professional_id = public.current_professional_id() then a.client_id
    else null
  end as client_id,
  case
    when a.professional_id = public.current_professional_id() then a.expected_amount_cents
    else null
  end as expected_amount_cents,
  a.created_at,
  a.updated_at
from public.appointments as a;

create view public.my_appointments as
select a.*
from public.appointments as a
where a.professional_id = public.current_professional_id();

revoke all on public.appointment_board from public, anon;
revoke all on public.my_appointments from public, anon;
grant select on public.appointment_board to authenticated;
grant select on public.my_appointments to authenticated;

revoke select on public.appointments from public, anon, authenticated;
grant insert, update, delete on public.appointments to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.professionals enable row level security;
alter table public.profiles enable row level security;
alter table public.business_settings enable row level security;
alter table public.rooms enable row level security;
alter table public.clients enable row level security;
alter table public.procedures enable row level security;
alter table public.procedure_professionals enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_private_notes enable row level security;
alter table public.appointment_status_history enable row level security;
alter table public.service_records enable row level security;
alter table public.return_reminders enable row level security;
alter table public.receivables enable row level security;
alter table public.payments enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.profit_distributions enable row level security;
alter table public.audit_logs enable row level security;

-- profissionais
create policy professionals_select_partner
  on public.professionals for select
  to authenticated
  using (public.is_partner());

-- perfis
create policy profiles_select_partner
  on public.profiles for select
  to authenticated
  using (public.is_partner());

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid() and public.is_partner())
  with check (id = auth.uid() and public.is_partner());

-- configuração da clínica
create policy business_settings_select_partner
  on public.business_settings for select
  to authenticated
  using (public.is_partner());

create policy business_settings_update_partner
  on public.business_settings for update
  to authenticated
  using (public.is_partner())
  with check (public.is_partner());

-- salas
create policy rooms_select_partner
  on public.rooms for select
  to authenticated
  using (public.is_partner());

create policy rooms_write_partner
  on public.rooms for all
  to authenticated
  using (public.is_partner())
  with check (public.is_partner());

-- clientes
create policy clients_select_partner
  on public.clients for select
  to authenticated
  using (public.is_partner());

create policy clients_insert_partner
  on public.clients for insert
  to authenticated
  with check (public.is_partner());

create policy clients_update_partner
  on public.clients for update
  to authenticated
  using (public.is_partner())
  with check (public.is_partner());

create policy clients_delete_partner
  on public.clients for delete
  to authenticated
  using (public.is_partner());

-- procedimentos
create policy procedures_select_partner
  on public.procedures for select
  to authenticated
  using (public.is_partner());

create policy procedures_write_partner
  on public.procedures for all
  to authenticated
  using (public.is_partner())
  with check (public.is_partner());

create policy procedure_professionals_select_partner
  on public.procedure_professionals for select
  to authenticated
  using (public.is_partner());

create policy procedure_professionals_write_partner
  on public.procedure_professionals for all
  to authenticated
  using (public.is_partner())
  with check (public.is_partner());

-- agenda: mutações apenas da própria profissional; leitura cruzada via appointment_board
create policy appointments_insert_own
  on public.appointments for insert
  to authenticated
  with check (
    public.is_partner()
    and professional_id = public.current_professional_id()
  );

create policy appointments_update_own
  on public.appointments for update
  to authenticated
  using (public.is_partner() and professional_id = public.current_professional_id())
  with check (public.is_partner() and professional_id = public.current_professional_id());

create policy appointments_delete_own
  on public.appointments for delete
  to authenticated
  using (public.is_partner() and professional_id = public.current_professional_id());

-- notas privadas
create policy appointment_notes_own
  on public.appointment_private_notes for all
  to authenticated
  using (public.is_partner() and professional_id = public.current_professional_id())
  with check (public.is_partner() and professional_id = public.current_professional_id());

create policy appointment_status_history_select
  on public.appointment_status_history for select
  to authenticated
  using (public.is_partner());

create policy appointment_status_history_insert
  on public.appointment_status_history for insert
  to authenticated
  with check (public.is_partner());

-- atendimentos / retornos
create policy service_records_select_partner
  on public.service_records for select
  to authenticated
  using (public.is_partner());

create policy service_records_insert_partner
  on public.service_records for insert
  to authenticated
  with check (public.is_partner());

create policy return_reminders_select_partner
  on public.return_reminders for select
  to authenticated
  using (public.is_partner());

create policy return_reminders_write_partner
  on public.return_reminders for all
  to authenticated
  using (public.is_partner())
  with check (public.is_partner());

-- financeiro: leitura consolidada; escrita só dos próprios lançamentos
create policy receivables_select_partner
  on public.receivables for select
  to authenticated
  using (public.is_partner());

create policy receivables_insert_own
  on public.receivables for insert
  to authenticated
  with check (
    public.is_partner()
    and professional_id = public.current_professional_id()
    and created_by = auth.uid()
  );

create policy receivables_update_own
  on public.receivables for update
  to authenticated
  using (public.is_partner() and professional_id = public.current_professional_id())
  with check (public.is_partner() and professional_id = public.current_professional_id());

create policy payments_select_partner
  on public.payments for select
  to authenticated
  using (public.is_partner());

create policy payments_insert_own
  on public.payments for insert
  to authenticated
  with check (
    public.is_partner()
    and professional_id = public.current_professional_id()
    and created_by = auth.uid()
  );

create policy expense_categories_select_partner
  on public.expense_categories for select
  to authenticated
  using (public.is_partner());

create policy expense_categories_write_partner
  on public.expense_categories for all
  to authenticated
  using (public.is_partner())
  with check (public.is_partner());

create policy expenses_select_partner
  on public.expenses for select
  to authenticated
  using (public.is_partner());

create policy expenses_insert_partner
  on public.expenses for insert
  to authenticated
  with check (
    public.is_partner()
    and created_by = auth.uid()
    and (
      responsibility = 'shared'
      or responsibility::text = public.current_professional_slug()::text
    )
  );

create policy expenses_update_restricted
  on public.expenses for update
  to authenticated
  using (
    public.is_partner()
    and (
      responsibility = 'shared'
      or responsibility::text = public.current_professional_slug()::text
    )
  )
  with check (
    public.is_partner()
    and (
      responsibility = 'shared'
      or responsibility::text = public.current_professional_slug()::text
    )
  );

create policy profit_distributions_select_partner
  on public.profit_distributions for select
  to authenticated
  using (public.is_partner());

create policy profit_distributions_insert_partner
  on public.profit_distributions for insert
  to authenticated
  with check (public.is_partner() and created_by = auth.uid());

create policy profit_distributions_update_partner
  on public.profit_distributions for update
  to authenticated
  using (public.is_partner())
  with check (public.is_partner());

create policy audit_logs_select_partner
  on public.audit_logs for select
  to authenticated
  using (public.is_partner());

create policy audit_logs_insert_partner
  on public.audit_logs for insert
  to authenticated
  with check (public.is_partner() and actor_id = auth.uid());
