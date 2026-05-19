-- =============================================
-- MIGRATION 004: Fix RLS infinite recursion on profiles
-- =============================================
-- Las policies originales hacen `(select X from profiles where id = auth.uid())`
-- dentro de subqueries. Esto dispara la misma policy → recursión.
--
-- Fix: extraer esos lookups a funciones SECURITY DEFINER, que saltan RLS
-- internamente. Patrón estándar en Supabase para evitar recursión.
-- =============================================

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

-- Recreate policies eliminando subqueries recursivas a profiles.

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (
    id = auth.uid()
    or community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

drop policy if exists "communities_select" on communities;
create policy "communities_select" on communities
  for select using (
    firm_id = public.current_user_firm_id()
    or id = public.current_user_community_id()
  );

drop policy if exists "communities_insert_admin" on communities;
create policy "communities_insert_admin" on communities
  for insert with check (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "incidences_select" on incidences;
create policy "incidences_select" on incidences
  for select using (
    community_id = public.current_user_community_id()
    or community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

drop policy if exists "incidences_insert_neighbor" on incidences;
create policy "incidences_insert_neighbor" on incidences
  for insert with check (
    community_id = public.current_user_community_id()
    and reported_by = auth.uid()
  );

drop policy if exists "incidences_update_admin" on incidences;
create policy "incidences_update_admin" on incidences
  for update using (
    community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

drop policy if exists "messages_select" on incidence_messages;
create policy "messages_select" on incidence_messages
  for select using (
    incidence_id in (select id from incidences)
    and (
      is_internal = false
      or public.current_user_role() in ('admin', 'president')
    )
  );

drop policy if exists "documents_select" on documents;
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

drop policy if exists "documents_insert_admin" on documents;
create policy "documents_insert_admin" on documents
  for insert with check (
    community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

drop policy if exists "invitations_admin" on invitations;
create policy "invitations_admin" on invitations
  for all using (
    community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );
