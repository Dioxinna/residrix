// Procesa una meeting end-to-end: descarga audio de Storage, transcribe
// con Groq Whisper, resume con el AIProvider configurado, actualiza la
// fila. Idempotente respecto al status: cualquier paso ya completado se
// salta si lo intentas dos veces.
//
// Pensado para llamarse vía `after()` desde el upload endpoint, o desde
// un endpoint de retry manual.

import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { resolveAIProvider } from '@/lib/ai'
import { transcribeAudio } from '@/lib/ai/transcribe'

const STORAGE_BUCKET = 'meeting-audios'

export async function processMeeting(meetingId: string): Promise<void> {
  const supabase = createSupabaseServiceClient()

  const { data: meeting, error: fetchErr } = await supabase
    .from('meetings')
    .select(
      'id, community_id, audio_path, status, transcript, summary, title, meeting_date, communities(name)',
    )
    .eq('id', meetingId)
    .single()

  if (fetchErr || !meeting) {
    console.error('[processMeeting] meeting not found', { meetingId, fetchErr })
    return
  }
  if (meeting.status === 'completed') return

  const community = (meeting.communities ?? null) as { name: string } | null
  const communityName = community?.name ?? 'Comunidad'

  try {
    // ---------- 1. Transcribir si falta ----------
    let transcript = meeting.transcript ?? null
    if (!transcript) {
      await supabase.from('meetings').update({ status: 'transcribing' }).eq('id', meetingId)

      const { data: download, error: dlErr } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .download(meeting.audio_path)
      if (dlErr || !download) {
        throw new Error(`No se pudo descargar el audio: ${dlErr?.message ?? 'unknown'}`)
      }

      const ext = meeting.audio_path.split('.').pop() ?? 'm4a'
      const filename = `${meetingId}.${ext}`

      const result = await transcribeAudio(download, filename)
      transcript = result.text

      await supabase
        .from('meetings')
        .update({
          status: 'transcribed',
          transcript,
          audio_duration_seconds: result.durationSeconds,
        })
        .eq('id', meetingId)
    }

    // ---------- 2. Resumir si falta ----------
    if (!meeting.summary) {
      await supabase.from('meetings').update({ status: 'summarizing' }).eq('id', meetingId)

      const provider = resolveAIProvider()
      if (!provider) {
        throw new Error('Ningún provider IA configurado (necesario para el resumen)')
      }

      const { summary } = await provider.summarizeMeeting({
        transcript,
        communityName,
        meetingDate: meeting.meeting_date,
        title: meeting.title,
      })

      await supabase
        .from('meetings')
        .update({ status: 'completed', summary })
        .eq('id', meetingId)
    } else {
      // Transcript ya estaba y summary también: marca completed por idempotencia.
      await supabase.from('meetings').update({ status: 'completed' }).eq('id', meetingId)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[processMeeting] failed', { meetingId, message })
    await supabase
      .from('meetings')
      .update({ status: 'failed', error_message: message.slice(0, 1000) })
      .eq('id', meetingId)
  }
}
