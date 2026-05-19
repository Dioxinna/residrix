-- =============================================
-- MIGRATION 003: Email field on invitations
-- =============================================
-- Para enviar el código de invitación por correo al vecino cuando el
-- administrador la crea.

alter table invitations add column if not exists email text;
create index if not exists invitations_email_idx on invitations(email) where email is not null;
