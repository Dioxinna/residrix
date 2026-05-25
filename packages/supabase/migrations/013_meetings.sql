-- =============================================
-- MIGRATION 013: Meetings (Total tier — Transcripción de juntas)
-- =============================================
-- Sube el audio de una junta de propietarios → Groq Whisper transcribe
-- → LLM resume + extrae acuerdos. Solo admin de la firma puede subir y
-- ver (el audio contiene voces identificables y debates internos; los
-- vecinos no acceden por defecto). Si en el futuro queremos exponer
-- el acta resumida a vecinos, lo haremos vía documentos generados.
-- =============================================

create table if not exists meetings (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  firm_id uuid not null references firms(id) on delete cascade,
  title text not null,
  meeting_date date not null,
  audio_path text not null,
  audio_size_bytes bigint not null check (audio_size_bytes > 0),
  audio_duration_seconds int,
  status text not null check (status in (
    'pending', 'transcribing', 'transcribed', 'summarizing', 'completed', 'failed'
  )) default 'pending',
  transcript text,
  summary text,
  error_message text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists meetings_community_date_idx
  on meetings (community_id, meeting_date desc);

create index if not exists meetings_firm_date_idx
  on meetings (firm_id, meeting_date desc);

create index if not exists meetings_status_idx
  on meetings (status) where status in ('pending', 'transcribing', 'summarizing');

drop trigger if exists meetings_updated_at on meetings;
create trigger meetings_updated_at
  before update on meetings
  for each row execute function update_updated_at();

create or replace function public.enforce_meeting_firm_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  community_firm uuid;
begin
  select firm_id into community_firm from communities where id = new.community_id;
  if community_firm is null then
    raise exception 'community % no existe', new.community_id;
  end if;
  if new.firm_id <> community_firm then
    raise exception 'firm_id mismatch: el firm_id de la junta debe coincidir con el de la comunidad';
  end if;
  return new;
end;
$$;

drop trigger if exists meetings_firm_consistency on meetings;
create trigger meetings_firm_consistency
  before insert or update on meetings
  for each row execute function public.enforce_meeting_firm_consistency();

alter table meetings enable row level security;

drop policy if exists "meetings_admin_select" on meetings;
create policy "meetings_admin_select" on meetings
  for select using (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "meetings_admin_insert" on meetings;
create policy "meetings_admin_insert" on meetings
  for insert with check (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "meetings_admin_update" on meetings;
create policy "meetings_admin_update" on meetings
  for update using (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );

drop policy if exists "meetings_admin_delete" on meetings;
create policy "meetings_admin_delete" on meetings
  for delete using (
    firm_id = public.current_user_firm_id()
    and public.current_user_role() = 'admin'
  );

-- ---------- Storage: meeting-audios ----------
-- Crea el bucket si no existe (idempotente).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meeting-audios',
  'meeting-audios',
  false,
  26214400, -- 25 MB (límite Groq Whisper)
  array['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/flac']
)
on conflict (id) do nothing;

-- Path: <community_id>/<meeting_id>.<ext>
-- Solo admin de la firma propietaria de la comunidad puede operar.

drop policy if exists "meeting_audios_upload" on storage.objects;
create policy "meeting_audios_upload" on storage.objects
  for insert with check (
    bucket_id = 'meeting-audios'
    and public.current_user_role() = 'admin'
    and (string_to_array(name, '/'))[1]::uuid in (
      select id from communities where firm_id = public.current_user_firm_id()
    )
  );

drop policy if exists "meeting_audios_read" on storage.objects;
create policy "meeting_audios_read" on storage.objects
  for select using (
    bucket_id = 'meeting-audios'
    and public.current_user_role() = 'admin'
    and (string_to_array(name, '/'))[1]::uuid in (
      select id from communities where firm_id = public.current_user_firm_id()
    )
  );

drop policy if exists "meeting_audios_delete" on storage.objects;
create policy "meeting_audios_delete" on storage.objects
  for delete using (
    bucket_id = 'meeting-audios'
    and public.current_user_role() = 'admin'
    and (string_to_array(name, '/'))[1]::uuid in (
      select id from communities where firm_id = public.current_user_firm_id()
    )
  );
