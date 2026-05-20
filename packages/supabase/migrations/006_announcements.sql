-- =============================================
-- MIGRATION 006: Announcements (comunicados)
-- =============================================
-- Avisos del administrador a toda la comunidad. Aparecen en el feed
-- home del móvil y disparan notificación push+email a todos los vecinos.
-- =============================================

create table announcements (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  author_id uuid not null references profiles(id),
  title text not null,
  body text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index announcements_community_id_idx on announcements(community_id);
create index announcements_created_at_idx on announcements(created_at desc);

create trigger announcements_updated_at
  before update on announcements
  for each row execute function update_updated_at();

alter table announcements enable row level security;

-- Vecino ve los de su comunidad; admin ve los de su firma
create policy "announcements_select" on announcements
  for select using (
    community_id = public.current_user_community_id()
    or community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

create policy "announcements_insert_admin" on announcements
  for insert with check (
    community_id in (
      select id from communities where firm_id = public.current_user_firm_id()
    )
    and author_id = auth.uid()
  );

create policy "announcements_update_admin" on announcements
  for update using (
    community_id in (
      select id from communities where firm_id = public.current_user_firm_id()
    )
  );

create policy "announcements_delete_admin" on announcements
  for delete using (
    community_id in (
      select id from communities where firm_id = public.current_user_firm_id()
    )
  );

alter publication supabase_realtime add table announcements;

-- Preferencias de notificación para comunicados
alter table notification_preferences
  add column if not exists push_new_announcement boolean not null default true;
alter table notification_preferences
  add column if not exists email_new_announcement boolean not null default true;
