-- =============================================
-- MIGRATION 008: Security hardening
-- =============================================
-- 1) Trigger anti-escalation en profiles: un usuario no puede
--    cambiar su propio role / firm_id / community_id desde el cliente.
--    (Endpoints server-side con service client siguen pudiendo — esos
--    bypasean RLS y triggers SECURITY DEFINER, pero `auth.uid()` es NULL
--    en ese contexto, así que la guarda del trigger no se activa.)
-- 2) Storage policies más estrechas:
--    - community-docs: paths son `{community_id}/...`; restringimos
--      por comunidad+firma.
--    - incidence-photos: paths son `{user_id}/...`; restringimos
--      upload a tu propia carpeta.
-- =============================================

-- ---------- 1) Anti-escalation ----------
create or replace function public.prevent_profile_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() = new.id then
    if old.role is distinct from new.role then
      raise exception 'No puedes cambiar tu propio rol';
    end if;
    if old.firm_id is distinct from new.firm_id then
      raise exception 'No puedes cambiar tu propia firma';
    end if;
    if old.community_id is distinct from new.community_id then
      raise exception 'No puedes cambiar tu propia comunidad';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_escalation on profiles;
create trigger profiles_prevent_escalation
  before update on profiles
  for each row execute function public.prevent_profile_escalation();

-- ---------- 2) Storage: community-docs ----------
drop policy if exists "community_docs_upload" on storage.objects;
drop policy if exists "community_docs_read" on storage.objects;
drop policy if exists "community_docs_delete" on storage.objects;

-- Helper: extrae el primer segmento del path como uuid (== community_id)
-- (Postgres permite cast por valor; si el path no es UUID el cast falla y la
-- expresión devuelve NULL bajo `where`, lo que niega la policy. OK.)

create policy "community_docs_upload" on storage.objects
  for insert with check (
    bucket_id = 'community-docs'
    and (string_to_array(name, '/'))[1]::uuid in (
      select id from communities where firm_id = public.current_user_firm_id()
    )
  );

create policy "community_docs_read" on storage.objects
  for select using (
    bucket_id = 'community-docs'
    and (
      (string_to_array(name, '/'))[1]::uuid = public.current_user_community_id()
      or (string_to_array(name, '/'))[1]::uuid in (
        select id from communities where firm_id = public.current_user_firm_id()
      )
    )
  );

create policy "community_docs_delete" on storage.objects
  for delete using (
    bucket_id = 'community-docs'
    and (string_to_array(name, '/'))[1]::uuid in (
      select id from communities where firm_id = public.current_user_firm_id()
    )
  );

-- ---------- 3) Storage: incidence-photos ----------
drop policy if exists "incidence_photos_upload" on storage.objects;
drop policy if exists "incidence_photos_read" on storage.objects;

create policy "incidence_photos_upload" on storage.objects
  for insert with check (
    bucket_id = 'incidence-photos'
    and (string_to_array(name, '/'))[1]::uuid = auth.uid()
  );

-- Lectura: cualquier authenticated. Las fotos van en `photo_url` en la
-- tabla `incidences` y la RLS de esa tabla ya limita por comunidad/firma.
-- Si más adelante se quiere ocultar fotos cross-comunidad incluso con la
-- URL filtrada, habrá que mover a signed URLs.
create policy "incidence_photos_read" on storage.objects
  for select using (
    bucket_id = 'incidence-photos' and auth.role() = 'authenticated'
  );
