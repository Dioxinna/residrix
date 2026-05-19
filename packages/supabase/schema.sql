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
  push_token text,
  created_at timestamptz default now()
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
  code text not null unique default substr(md5(random()::text), 1, 8),
  role text not null default 'neighbor' check (role in ('neighbor', 'tenant', 'president')),
  used_by uuid references profiles(id),
  used_at timestamptz,
  expires_at timestamptz default now() + interval '30 days',
  created_at timestamptz default now()
);

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

-- Auto-crear perfil cuando se registra un usuario
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'role', 'neighbor')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table firms enable row level security;
alter table communities enable row level security;
alter table profiles enable row level security;
alter table incidences enable row level security;
alter table incidence_messages enable row level security;
alter table documents enable row level security;
alter table invitations enable row level security;

-- FIRMS: solo el admin del despacho ve su firma
create policy "firms_select_own" on firms
  for select using (
    id = (select firm_id from profiles where id = auth.uid())
  );

-- COMMUNITIES: admin ve las de su despacho; vecino ve la suya
create policy "communities_select" on communities
  for select using (
    firm_id = (select firm_id from profiles where id = auth.uid())
    or
    id = (select community_id from profiles where id = auth.uid())
  );

create policy "communities_insert_admin" on communities
  for insert with check (
    firm_id = (select firm_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'admin'
  );

-- PROFILES: cada uno ve el suyo; admin ve los de sus comunidades
create policy "profiles_select_own" on profiles
  for select using (
    id = auth.uid()
    or
    community_id in (
      select id from communities
      where firm_id = (select firm_id from profiles where id = auth.uid())
    )
  );

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- INCIDENCES: vecino ve las de su comunidad; admin ve las de su despacho
create policy "incidences_select" on incidences
  for select using (
    community_id = (select community_id from profiles where id = auth.uid())
    or
    community_id in (
      select id from communities
      where firm_id = (select firm_id from profiles where id = auth.uid())
    )
  );

create policy "incidences_insert_neighbor" on incidences
  for insert with check (
    community_id = (select community_id from profiles where id = auth.uid())
    and reported_by = auth.uid()
  );

create policy "incidences_update_admin" on incidences
  for update using (
    community_id in (
      select id from communities
      where firm_id = (select firm_id from profiles where id = auth.uid())
    )
  );

-- INCIDENCE_MESSAGES: misma lógica que incidencias; internos solo para admin
create policy "messages_select" on incidence_messages
  for select using (
    incidence_id in (select id from incidences)
    and (
      is_internal = false
      or
      (select role from profiles where id = auth.uid()) in ('admin', 'president')
    )
  );

create policy "messages_insert" on incidence_messages
  for insert with check (sender_id = auth.uid());

-- DOCUMENTS: públicos para vecinos de la comunidad; privados solo admin/presidente
create policy "documents_select" on documents
  for select using (
    community_id = (select community_id from profiles where id = auth.uid())
    and (
      is_public = true
      or (select role from profiles where id = auth.uid()) in ('admin', 'president')
    )
    or
    community_id in (
      select id from communities
      where firm_id = (select firm_id from profiles where id = auth.uid())
    )
  );

create policy "documents_insert_admin" on documents
  for insert with check (
    community_id in (
      select id from communities
      where firm_id = (select firm_id from profiles where id = auth.uid())
    )
  );

-- INVITATIONS: admin crea y ve; vecino solo puede leer la suya por código
create policy "invitations_admin" on invitations
  for all using (
    community_id in (
      select id from communities
      where firm_id = (select firm_id from profiles where id = auth.uid())
    )
  );

-- =============================================
-- REALTIME
-- =============================================

alter publication supabase_realtime add table incidences;
alter publication supabase_realtime add table incidence_messages;

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
