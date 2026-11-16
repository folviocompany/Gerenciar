-- Execute manualmente no Supabase SQL Editor DEPOIS de criar as duas usuárias
-- em Authentication > Users.
-- Substitua somente os dois UUIDs abaixo. UUIDs não são senhas nem chaves.
-- Este script pode ser executado novamente com segurança para atualizar os dados.
-- Nunca o execute no navegador da aplicação. Nenhuma senha ou service_role é usada.
begin;

insert into public.profiles (id, display_name, active)
values
  ('REPLACE_WITH_ESTER_AUTH_UUID'::uuid, 'Ester', true),
  ('REPLACE_WITH_IZABELA_AUTH_UUID'::uuid, 'Dra. Izabela', true)
on conflict (id) do update
set display_name = excluded.display_name,
    active = excluded.active;

insert into public.professionals (user_id, specialty, color)
values
  ('REPLACE_WITH_ESTER_AUTH_UUID'::uuid, 'Lash Designer', '#B66F8B'),
  ('REPLACE_WITH_IZABELA_AUTH_UUID'::uuid, 'Estética avançada', '#C5A06A')
on conflict (user_id) do update
set specialty = excluded.specialty,
    color = excluded.color;

commit;
