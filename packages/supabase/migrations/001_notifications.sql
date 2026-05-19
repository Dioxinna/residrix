-- =============================================
-- MIGRATION 001: Notifications
-- =============================================
-- Adds:
--   - device_tokens (Expo push tokens per device)
--   - notification_preferences (per-user opt-in/out by channel × event)
-- Deprecates:
--   - profiles.push_token (single-token field, superseded by device_tokens)
-- =============================================

-- ---------------------------------------------
-- device_tokens
-- ---------------------------------------------
create table device_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index device_tokens_user_id_idx on device_tokens(user_id);

alter table device_tokens enable row level security;

create policy "device_tokens_select_own" on device_tokens
  for select using (user_id = auth.uid());

create policy "device_tokens_insert_own" on device_tokens
  for insert with check (user_id = auth.uid());

create policy "device_tokens_update_own" on device_tokens
  for update using (user_id = auth.uid());

create policy "device_tokens_delete_own" on device_tokens
  for delete using (user_id = auth.uid());

-- ---------------------------------------------
-- notification_preferences
-- ---------------------------------------------
create table notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_new_incidence boolean not null default true,
  push_status_change boolean not null default true,
  push_new_message boolean not null default true,
  email_new_incidence boolean not null default true,
  email_status_change boolean not null default true,
  email_new_message boolean not null default false,
  email_invite_code boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table notification_preferences enable row level security;

create policy "notification_preferences_select_own" on notification_preferences
  for select using (user_id = auth.uid());

create policy "notification_preferences_insert_own" on notification_preferences
  for insert with check (user_id = auth.uid());

create policy "notification_preferences_update_own" on notification_preferences
  for update using (user_id = auth.uid());

-- Auto-create default prefs row for every new profile.
-- search_path explícito porque supabase_auth_admin tiene el path bloqueado.
create or replace function handle_new_profile_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_profile_created_notifications
  after insert on profiles
  for each row execute function handle_new_profile_notifications();

-- Backfill existing profiles
insert into notification_preferences (user_id)
select id from profiles
on conflict (user_id) do nothing;

-- ---------------------------------------------
-- Deprecate profiles.push_token
-- ---------------------------------------------
alter table profiles drop column if exists push_token;
