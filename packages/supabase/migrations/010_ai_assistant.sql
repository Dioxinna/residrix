-- =============================================
-- MIGRATION 010: AI Assistant (Pro tier)
-- =============================================
-- Añade columnas para el Agente IA de incidencias:
--   - ai_group_key: clave semántica para agrupar incidencias similares
--     (ej. "elevator-stuck", "plumbing-leak-roof") generada por la IA al
--     clasificar. Permite que /asistente-ia liste agrupaciones.
--   - ai_suggested_provider: tipo de proveedor sugerido para escalar
--     ("plumber", "electrician", etc.) o null si no aplica.
--   - ai_response_accepted_at: cuándo el admin envió la respuesta sugerida
--     al vecino (uso como mensaje). Métrica de adopción de la IA.
--
-- Toggle a nivel de firma para apagar el agente entero (cumple feature
-- gating: si tier < pro, el endpoint no llama a la IA; si tier >= pro y
-- ai_assistant_enabled = false, tampoco).
-- =============================================

alter table incidences
  add column if not exists ai_group_key text,
  add column if not exists ai_suggested_provider text,
  add column if not exists ai_response_accepted_at timestamptz;

alter table firms
  add column if not exists ai_assistant_enabled boolean not null default true;

-- Índice para acelerar el agrupamiento en /asistente-ia
create index if not exists incidences_ai_group_key_idx
  on incidences (community_id, ai_group_key)
  where ai_group_key is not null;
