-- =============================================
-- MIGRATION 012: Expenses (Base tier — Gastos básicos)
-- =============================================
-- Registro de gastos por comunidad. Cada gasto pertenece a una comunidad
-- (no a la firma directamente — el firm_id se denormaliza solo para
-- acelerar queries y aislar RLS). Importes en céntimos enteros para no
-- arrastrar errores de coma flotante. Liquidaciones (Pro) consumirán
-- esta tabla más adelante.
-- =============================================

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  firm_id uuid not null references firms(id) on delete cascade,
  amount_cents int not null check (amount_cents >= 0),
  category text not null check (category in (
    'suministros', 'limpieza', 'mantenimiento', 'ascensor',
    'seguros', 'administracion', 'jardineria', 'obras', 'otros'
  )),
  description text not null,
  expense_date date not null,
  paid_at date,
  vendor_name text,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists expenses_community_date_idx
  on expenses (community_id, expense_date desc);

create index if not exists expenses_firm_date_idx
  on expenses (firm_id, expense_date desc);

drop trigger if exists expenses_updated_at on expenses;
create trigger expenses_updated_at
  before update on expenses
  for each row execute function update_updated_at();

-- Asegura que firm_id de un expense coincide con el de su community.
-- Evita que un admin de firma A meta un gasto en comunidad de firma B
-- pasando un firm_id falso desde el cliente.
create or replace function public.enforce_expense_firm_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  community_firm uuid;
begin
  select firm_id into community_firm from communities where id = new.community_id;
  if community_firm is null then
    raise exception 'community % no existe', new.community_id;
  end if;
  if new.firm_id <> community_firm then
    raise exception 'firm_id mismatch: el firm_id del gasto debe coincidir con el de la comunidad';
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_firm_consistency on expenses;
create trigger expenses_firm_consistency
  before insert or update on expenses
  for each row execute function public.enforce_expense_firm_consistency();

alter table expenses enable row level security;

-- Admin de la firma: CRUD completo de gastos de cualquier comunidad de su firma.
-- Vecinos / president de una comunidad: solo lectura de los gastos de SU comunidad.
drop policy if exists "expenses_select" on expenses;
create policy "expenses_select" on expenses
  for select using (
    (firm_id = public.current_user_firm_id() and public.current_user_role() = 'admin')
    or community_id = public.current_user_community_id()
  );

drop policy if exists "expenses_admin_insert" on expenses;
create policy "expenses_admin_insert" on expenses
  for insert with check (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "expenses_admin_update" on expenses;
create policy "expenses_admin_update" on expenses
  for update using (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "expenses_admin_delete" on expenses;
create policy "expenses_admin_delete" on expenses
  for delete using (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );
