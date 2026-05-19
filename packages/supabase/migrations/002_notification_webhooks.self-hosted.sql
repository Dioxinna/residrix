-- =============================================
-- MIGRATION 002 (SOLO SELF-HOSTED): Database Webhooks
-- =============================================
--
-- NO EJECUTAR en Supabase managed (Cloud) — no tienes permisos para
-- `alter database ... set app.settings.x`.
--
-- En Supabase managed usa la UI:
--   Dashboard → Database → Webhooks → Create a new hook
-- Crea 3 webhooks (incidences INSERT, incidences UPDATE, incidence_messages INSERT)
-- apuntando a /api/notifications/webhook con el header
-- `Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>`.
--
-- Este archivo queda como referencia para despliegues self-hosted donde
-- sí puedes ser superuser y configurar GUCs vía `alter database`.
--
-- Requiere `pg_net` (Dashboard > Database > Extensions). Antes de aplicar:
--   alter database postgres set app.settings.webhook_url    = '...';
--   alter database postgres set app.settings.webhook_secret = '...';
-- =============================================

create extension if not exists pg_net;

-- Helper: envía un POST asíncrono al endpoint con el payload del trigger
create or replace function notify_webhook()
returns trigger as $$
declare
  webhook_url text := current_setting('app.settings.webhook_url', true);
  webhook_secret text := current_setting('app.settings.webhook_secret', true);
  payload jsonb;
begin
  if webhook_url is null or webhook_url = '' or webhook_secret is null or webhook_secret = '' then
    raise warning 'notify_webhook: app.settings.webhook_url/webhook_secret no configurados; saltando notificación para %.%', tg_table_name, tg_op;
    return coalesce(new, old);
  end if;

  payload := jsonb_build_object(
    'type', tg_op,
    'table', tg_table_name,
    'record', case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    'old_record', case when tg_op = 'INSERT' then null else to_jsonb(old) end
  );

  perform net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    ),
    body := payload
  );

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Triggers
drop trigger if exists incidences_notify on incidences;
create trigger incidences_notify
  after insert or update of status on incidences
  for each row execute function notify_webhook();

drop trigger if exists incidence_messages_notify on incidence_messages;
create trigger incidence_messages_notify
  after insert on incidence_messages
  for each row execute function notify_webhook();
