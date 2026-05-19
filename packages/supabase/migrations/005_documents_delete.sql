-- =============================================
-- MIGRATION 005: Allow admins to delete documents
-- =============================================
-- La migración inicial solo creó policies SELECT e INSERT para documents
-- y Storage. Sin DELETE policies, RLS bloquea silenciosamente el borrado.
-- =============================================

create policy "documents_delete_admin" on documents
  for delete using (
    community_id in (
      select id from communities
      where firm_id = public.current_user_firm_id()
    )
  );

create policy "community_docs_delete" on storage.objects
  for delete using (
    bucket_id = 'community-docs' and auth.role() = 'authenticated'
  );
