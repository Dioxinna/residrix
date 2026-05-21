-- =============================================
-- MIGRATION 011: Providers (Pro tier)
-- =============================================
-- Directorio de proveedores por firma (fontanero, electricista, ascensor,
-- etc). Se conecta con el Agente IA: cuando una incidencia tiene
-- ai_suggested_provider, el detalle muestra los proveedores de ese tipo
-- de la firma con CTAs llamar/email.
-- =============================================

create table if not exists providers (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid not null references firms(id) on delete cascade,
  name text not null,
  provider_type text not null check (provider_type in (
    'plumber', 'electrician', 'elevator_technician', 'cleaner',
    'locksmith', 'glazier', 'general_maintenance', 'other'
  )),
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists providers_firm_type_idx
  on providers (firm_id, provider_type);

drop trigger if exists providers_updated_at on providers;
create trigger providers_updated_at
  before update on providers
  for each row execute function update_updated_at();

alter table providers enable row level security;

-- Cualquier miembro de la firma puede VER los proveedores (un president o
-- vecino podría mirarlos como referencia). Solo admin puede CRUD.
drop policy if exists "providers_select" on providers;
create policy "providers_select" on providers
  for select using (firm_id = public.current_user_firm_id());

drop policy if exists "providers_admin_insert" on providers;
create policy "providers_admin_insert" on providers
  for insert with check (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "providers_admin_update" on providers;
create policy "providers_admin_update" on providers
  for update using (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "providers_admin_delete" on providers;
create policy "providers_admin_delete" on providers
  for delete using (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );
