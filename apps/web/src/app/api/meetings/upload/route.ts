import { randomUUID } from 'node:crypto'
import { after } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { firmHasFeature } from '@/lib/auth/feature-gate'
import { processMeeting } from '@/lib/meetings/process'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Whisper Large v3 Turbo procesa muy rápido (10-30× realtime). 25 MB de
// audio (~50 min) cabe holgadamente en 300s, pero subimos el techo por
// si Groq tiene cola. 600s requiere plan Pro de Vercel; con plan Hobby
// se queda en el default 300s y aun así sobra.
export const maxDuration = 600

const STORAGE_BUCKET = 'meeting-audios'
const MAX_BYTES = 25 * 1024 * 1024 // 25 MB — límite Groq Whisper
const ALLOWED_EXTS = new Set(['mp3', 'm4a', 'mp4', 'wav', 'webm', 'ogg', 'flac'])
const ALLOWED_MIME = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/x-m4a',
  'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/flac',
])
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function extFromFilename(name: string): string {
  const parts = name.toLowerCase().split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

export async function POST(request: Request) {
  if (!(await firmHasFeature('meeting_transcripts'))) {
    return Response.json({ error: 'Feature no disponible en tu plan' }, { status: 403 })
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin' || !profile.firm_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Multipart inválido' }, { status: 400 })
  }

  const file = formData.get('file')
  const communityId = formData.get('communityId')
  const title = formData.get('title')
  const meetingDate = formData.get('meetingDate')

  if (!(file instanceof File)) {
    return Response.json({ error: 'Falta el archivo de audio' }, { status: 400 })
  }
  if (typeof communityId !== 'string' || typeof title !== 'string' || typeof meetingDate !== 'string') {
    return Response.json({ error: 'Faltan campos' }, { status: 400 })
  }
  if (!title.trim()) return Response.json({ error: 'Título obligatorio' }, { status: 400 })
  if (!ISO_DATE.test(meetingDate)) {
    return Response.json({ error: 'Fecha inválida' }, { status: 400 })
  }
  if (file.size === 0) return Response.json({ error: 'Archivo vacío' }, { status: 400 })
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `Archivo demasiado grande (máx 25 MB; el tuyo ${(file.size / 1024 / 1024).toFixed(1)} MB)` },
      { status: 413 },
    )
  }

  const ext = extFromFilename(file.name)
  if (!ALLOWED_EXTS.has(ext)) {
    return Response.json({ error: `Extensión no soportada: .${ext}` }, { status: 400 })
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return Response.json({ error: `Tipo MIME no soportado: ${file.type}` }, { status: 400 })
  }

  // Verifica que la comunidad es de la firma del admin (defensa en
  // profundidad junto a RLS).
  const { data: community } = await supabase
    .from('communities')
    .select('id, firm_id')
    .eq('id', communityId)
    .single()
  if (!community || community.firm_id !== profile.firm_id) {
    return Response.json({ error: 'Comunidad no encontrada' }, { status: 404 })
  }

  const meetingId = randomUUID()
  const audioPath = `${communityId}/${meetingId}.${ext}`

  const service = createSupabaseServiceClient()

  // Sube a Storage con service role (evita exigirle al cliente headers
  // multipart adicionales y nos garantiza que RLS de la fila se evalúa
  // después de tener el path).
  const { error: uploadErr } = await service.storage
    .from(STORAGE_BUCKET)
    .upload(audioPath, file, {
      contentType: file.type || `audio/${ext}`,
      upsert: false,
    })

  if (uploadErr) {
    return Response.json({ error: `No se pudo subir el audio: ${uploadErr.message}` }, { status: 500 })
  }

  const { error: insertErr } = await service.from('meetings').insert({
    id: meetingId,
    community_id: communityId,
    firm_id: profile.firm_id,
    title: title.trim(),
    meeting_date: meetingDate,
    audio_path: audioPath,
    audio_size_bytes: file.size,
    status: 'pending',
    created_by: user.id,
  })

  if (insertErr) {
    // Rollback storage si la inserción falla, para no dejar audio
    // huérfano.
    await service.storage.from(STORAGE_BUCKET).remove([audioPath])
    return Response.json({ error: `No se pudo crear la junta: ${insertErr.message}` }, { status: 500 })
  }

  // Procesado en segundo plano: la respuesta vuelve al cliente
  // inmediatamente y `after()` arranca la transcripción + resumen.
  after(() => processMeeting(meetingId))

  return Response.json({ id: meetingId }, { status: 201 })
}
