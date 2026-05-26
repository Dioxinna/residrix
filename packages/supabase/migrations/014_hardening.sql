-- =============================================
-- MIGRATION 014: Hardening de seguridad
-- =============================================
-- 1) incidence-photos SELECT: cualquier auth user podía listar/leer
--    cualquier foto. Ahora solo se ven fotos subidas por:
--      - vecinos/president de TU comunidad
--      - cualquier miembro de TU firma (si eres admin/president)
--    El bucket sigue siendo público a nivel de URL (no migramos todas
--    las photo_url existentes), pero bloqueamos la enumeración vía API.
-- 2) firms UPDATE: hasta ahora SIN policy = nadie podía editar la firma
--    desde el cliente (ni siquiera el admin). Añadimos UPDATE solo admin
--    de la propia firma + trigger que bloquea cambios en columnas de
--    facturación (plan, stripe_*, subscription_*, current_period_end)
--    para que solo el webhook Stripe (service role) pueda modificarlas.
-- 3) firms DELETE: deliberadamente SIN policy. Borrar una firma debe
--    ser una operación administrativa fuera del producto.
-- =============================================

-- ---------- 1) incidence-photos SELECT tighten ----------

drop policy if exists "incidence_photos_read" on storage.objects;

create policy "incidence_photos_read" on storage.objects
  for select using (
    bucket_id = 'incidence-photos'
    and (string_to_array(name, '/'))[1]::uuid in (
      select id from public.profiles
      where
        community_id = public.current_user_community_id()
        or (
          firm_id = public.current_user_firm_id()
          and public.current_user_role() in ('admin', 'president')
        )
    )
  );

-- ---------- 2) firms UPDATE policy + billing column lock ----------

drop policy if exists "firms_admin_update" on firms;
create policy "firms_admin_update" on firms
  for update using (
    id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );

-- Trigger que blinda las columnas de facturación. Cualquier sesión
-- autenticada (auth.uid() not null) que intente cambiar plan,
-- stripe_*, subscription_* o current_period_end es rechazada. El
-- webhook de Stripe corre con service role (auth.uid() = null) y por
-- tanto sí puede actualizarlas.
create or replace function public.enforce_firm_billing_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    -- service role / postgres / webhook → permitir
    return new;
  end if;

  if new.plan is distinct from old.plan
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id
     or new.subscription_status is distinct from old.subscription_status
     or new.subscription_quantity is distinct from old.subscription_quantity
     or new.current_period_end is distinct from old.current_period_end
  then
    raise exception 'FIRM_BILLING_IMMUTABLE'
      using hint = 'Las columnas de facturación las gestiona el webhook de Stripe.';
  end if;

  return new;
end;
$$;

drop trigger if exists firms_billing_immutable on firms;
create trigger firms_billing_immutable
  before update on firms
  for each row execute function public.enforce_firm_billing_immutable();
