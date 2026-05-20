-- =============================================
-- MIGRATION 009: Billing (Stripe)
-- =============================================
-- Per-community subscription a 25€/mes:
--   - Free tier: 1 comunidad sin pago
--   - Para más: admin paga vía Stripe Checkout, quantity = nº comunidades
--   - Stripe webhook → /api/billing/webhook actualiza estos campos
-- =============================================

alter table firms
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists subscription_status text,
  add column if not exists subscription_quantity int,
  add column if not exists current_period_end timestamptz;

-- Trigger: limita el nº de comunidades por firma según subscription_quantity.
-- Free tier (sin subscription_quantity) → 1 comunidad.
-- Con sub activa → hasta subscription_quantity comunidades.
create or replace function public.check_community_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count int;
  allowed int;
  sub_status text;
begin
  select count(*) into current_count from communities where firm_id = new.firm_id;
  select coalesce(subscription_quantity, 1), subscription_status
    into allowed, sub_status
    from firms where id = new.firm_id;

  -- Si la suscripción no está activa, vuelve al free tier (1)
  if sub_status is null or sub_status not in ('active', 'trialing') then
    allowed := 1;
  end if;

  if current_count >= allowed then
    raise exception 'COMMUNITY_LIMIT_REACHED'
      using hint = format('Estás en el límite (%s). Suscríbete o aumenta la cantidad en /billing.', allowed);
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_community_limit on communities;
create trigger enforce_community_limit
  before insert on communities
  for each row execute function public.check_community_limit();
