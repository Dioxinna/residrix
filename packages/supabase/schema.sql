-- =============================================
-- EXTENSIONES
-- =============================================
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLAS
-- =============================================

-- Despachos de administración
create table firms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  phone text,
  plan text not null default 'base' check (plan in ('base', 'pro', 'total')),
  created_at timestamptz default now()
);

-- Comunidades gestionadas por un despacho
create table communities (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid not null references firms(id) on delete cascade,
  name text not null,
  address text not null,
  city text not null,
  postal_code text not null,
  units_count int not null default 0,
  president_id uuid,  -- FK a profiles, se añade después
  created_at timestamptz default now()
);

-- Perfiles de usuario (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'president', 'neighbor', 'tenant')),
  full_name text not null,
  phone text,
  community_id uuid references communities(id) on delete set null,
  firm_id uuid references firms(id) on delete set null,
  unit_number text,
  created_at timestamptz default now()
);

-- Tokens de dispositivo para push notifications (Expo)
create table device_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index device_tokens_user_id_idx on device_tokens(user_id);

-- Preferencias de notificación por usuario (canal × evento)
create table notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_new_incidence boolean not null default true,
  push_status_change boolean not null default true,
  push_new_message boolean not null default true,
  push_new_announcement boolean not null default true,
  email_new_incidence boolean not null default true,
  email_status_change boolean not null default true,
  email_new_message boolean not null default false,
  email_new_announcement boolean not null default true,
  email_invite_code boolean not null default true,
  updated_at timestamptz not null default now()
);

-- FK circular communities -> profiles
alter table communities
  add constraint communities_president_id_fkey
  foreign key (president_id) references profiles(id) on delete set null;

-- Incidencias
create table incidences (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  reported_by uuid not null references profiles(id),
  title text not null,
  description text not null,
  category text not null check (category in (
    'plumbing', 'electricity', 'cleaning', 'elevator',
    'structure', 'access', 'noise', 'other'
  )),
  urgency text not null default 'medium' check (urgency in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in (
    'open', 'in_progress', 'pending_neighbor', 'resolved', 'closed'
  )),
  photo_url text,
  ai_summary text,
  ai_response text,
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mensajes en hilo de incidencia
create table incidence_messages (
  id uuid primary key default uuid_generate_v4(),
  incidence_id uuid not null references incidences(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  content text not null,
  is_internal boolean not null default false,
  created_at timestamptz default now()
);

-- Comunicados / anuncios del administrador a la comunidad
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

-- Documentos de la comunidad
create table documents (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  name text not null,
  description text,
  file_url text not null,
  file_size int not null,
  mime_type text not null,
  category text not null default 'other' check (category in (
    'acta', 'estatutos', 'seguro', 'presupuesto', 'circular', 'other'
  )),
  uploaded_by uuid not null references profiles(id),
  is_public boolean not null default true,
  created_at timestamptz default now()
);

-- Invitaciones de vecinos (por código único)
create table invitations (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  unit_number text not null,
  email text,
  code text not null unique default substr(md5(random()::text), 1, 8),
  role text not null default 'neighbor' check (role in ('neighbor', 'tenant', 'president')),
  used_by uuid references profiles(id),
  used_at timestamptz,
  expires_at timestamptz default now() + interval '30 days',
  created_at timestamptz default now()
);

create index invitations_email_idx on invitations(email) where email is not null;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-actualizar updated_at en incidencias
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger incidences_updated_at
  before update on incidences
  for each row execute function update_updated_at();

create trigger announcements_updated_at
  before update on announcements
  for each row execute function update_updated_at();

-- Auto-crear perfil cuando se registra un usuario
-- search_path explícito: supabase_auth_admin (que dispara el trigger) tiene
-- un search_path bloqueado donde 'public' no está incluido por defecto.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'role', 'neighbor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-crear preferencias de notificación al crear un perfil
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

-- =============================================
-- HELPERS PARA RLS (SECURITY DEFINER para evitar recursión en profiles)
-- =============================================
-- Las policies que necesitan datos del profile actual deben usar estas
-- funciones, no subqueries directas. Sin esto, cualquier policy con
-- `(select X from profiles where id = auth.uid())` causa recursión infinita.

create or replace function public.current_user_firm_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select firm_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_community_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select community_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table firms enable row level security;
alter table communities enable row level security;
alter table profiles enable row level security;
alter table incidences enable row level security;
alter table incidence_messages enable row level security;
alter table announcements enable row level security;
alter table documents enable row level security;
alter table invitations enable row level security;
alter table device_tokens enable row level security;
alter table notification_preferences enable row level security;

-- FIRMS: solo el admin del despacho ve su firma
create policy "firms_select_own" on firms
  for select using (
    id = public.current_user_firm_id()
  );

-- COMMUNITIES: admin ve las de su despacho; vecino ve la suya
create policy "communities_select" on communities
  for select using (
    firm_id = public.current_user_firm_id()
    or id = public.current_user_community_id()
  );

create policy "communities_insert_admin" on communities
  for insert with check (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );

-- PROFILES: cada uno ve el suyo; admin ve los de sus comunidades
create policy "profiles_select_own" on profiles
  for select using (
    id = auth.uid()
    or community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- INCIDENCES: vecino ve las de su comunidad; admin ve las de su despacho
create policy "incidences_select" on incidences
  for select using (
    community_id = public.current_user_community_id()
    or community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

create policy "incidences_insert_neighbor" on incidences
  for insert with check (
    community_id = public.current_user_community_id()
    and reported_by = auth.uid()
  );

create policy "incidences_update_admin" on incidences
  for update using (
    community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

-- INCIDENCE_MESSAGES: misma lógica que incidencias; internos solo para admin
create policy "messages_select" on incidence_messages
  for select using (
    incidence_id in (select id from incidences)
    and (
      is_internal = false
      or public.current_user_role() in ('admin', 'president')
    )
  );

create policy "messages_insert" on incidence_messages
  for insert with check (sender_id = auth.uid());

-- ANNOUNCEMENTS: vecino ve los de su comunidad; admin CRUD los de su firma
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

-- DOCUMENTS: públicos para vecinos de la comunidad; privados solo admin/presidente
create policy "documents_select" on documents
  for select using (
    (
      community_id = public.current_user_community_id()
      and (
        is_public = true
        or public.current_user_role() in ('admin', 'president')
      )
    )
    or community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

create policy "documents_insert_admin" on documents
  for insert with check (
    community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

create policy "documents_delete_admin" on documents
  for delete using (
    community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

-- INVITATIONS: admin crea y ve; vecino solo puede leer la suya por código
create policy "invitations_admin" on invitations
  for all using (
    community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

-- DEVICE_TOKENS: cada usuario gestiona los suyos
create policy "device_tokens_select_own" on device_tokens
  for select using (user_id = auth.uid());
create policy "device_tokens_insert_own" on device_tokens
  for insert with check (user_id = auth.uid());
create policy "device_tokens_update_own" on device_tokens
  for update using (user_id = auth.uid());
create policy "device_tokens_delete_own" on device_tokens
  for delete using (user_id = auth.uid());

-- NOTIFICATION_PREFERENCES: cada usuario gestiona las suyas
create policy "notification_preferences_select_own" on notification_preferences
  for select using (user_id = auth.uid());
create policy "notification_preferences_insert_own" on notification_preferences
  for insert with check (user_id = auth.uid());
create policy "notification_preferences_update_own" on notification_preferences
  for update using (user_id = auth.uid());

-- =============================================
-- REALTIME
-- =============================================

alter publication supabase_realtime add table incidences;
alter publication supabase_realtime add table incidence_messages;
alter publication supabase_realtime add table announcements;

-- =============================================
-- STORAGE BUCKETS
-- =============================================

insert into storage.buckets (id, name, public)
values ('incidence-photos', 'incidence-photos', false);

insert into storage.buckets (id, name, public)
values ('community-docs', 'community-docs', false);

create policy "incidence_photos_upload" on storage.objects
  for insert with check (
    bucket_id = 'incidence-photos' and auth.role() = 'authenticated'
  );

create policy "incidence_photos_read" on storage.objects
  for select using (
    bucket_id = 'incidence-photos' and auth.role() = 'authenticated'
  );

create policy "community_docs_upload" on storage.objects
  for insert with check (
    bucket_id = 'community-docs' and auth.role() = 'authenticated'
  );

create policy "community_docs_read" on storage.objects
  for select using (
    bucket_id = 'community-docs' and auth.role() = 'authenticated'
  );

create policy "community_docs_delete" on storage.objects
  for delete using (
    bucket_id = 'community-docs' and auth.role() = 'authenticated'
  );
