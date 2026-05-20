-- =============================================
-- MIGRATION 007: UPDATE + DELETE policies para communities
-- =============================================
-- La migración inicial solo definió SELECT + INSERT para communities.
-- Sin estas, RLS bloquea silenciosamente editar y borrar comunidades
-- desde el panel admin.
-- =============================================

create policy "communities_update_admin" on communities
  for update using (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );

create policy "communities_delete_admin" on communities
  for delete using (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );
