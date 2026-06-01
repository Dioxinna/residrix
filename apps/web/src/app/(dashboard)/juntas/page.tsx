import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Mic } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { firmHasFeature } from '@/lib/auth/feature-gate'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import { UploadMeetingDialog } from './_components/UploadMeetingDialog'
import { MeetingsTable } from './_components/MeetingsTable'

export const metadata = { title: 'Juntas · Residrix' }

export default async function JuntasPage() {
  const allowed = await firmHasFeature('meeting_transcripts')
  if (!allowed) {
    return (
      <FeatureLock
        feature="meeting_transcripts"
        description="Sube el audio de la junta y obtén transcripción literal + acta resumida con acuerdos en minutos. Hasta 25 MB de audio (~50 min)."
      />
    )
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin' || !profile.firm_id) {
    return (
      <div className="px-6 py-10">
        <p className="text-ink-soft text-sm">Esta página es solo para administradores.</p>
      </div>
    )
  }

  const [{ data: communities }, { data: meetings }] = await Promise.all([
    supabase
      .from('communities')
      .select('id, name')
      .eq('firm_id', profile.firm_id)
      .order('name'),
    supabase
      .from('meetings')
      .select(
        'id, title, meeting_date, status, audio_duration_seconds, error_message, created_at, communities(name)',
      )
      .eq('firm_id', profile.firm_id)
      .order('meeting_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  if (!communities || communities.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink mb-2">Juntas</h1>
        <p className="text-ink-soft mb-6">
          Crea una comunidad antes de subir audios de junta.
        </p>
        <Link
          href="/comunidades"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded"
        >
          Ir a Comunidades →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <Mic size={18} className="text-amber-400" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-semibold text-ink">Juntas</h1>
      </div>
      <p className="text-sm text-ink-soft mb-6">
        Sube el audio de la junta y la IA transcribe + redacta el acta. Hasta 25 MB por archivo (~50 min mono).
      </p>

      <div className="flex justify-end mb-6">
        <UploadMeetingDialog communities={communities} />
      </div>

      <MeetingsTable meetings={meetings ?? []} />
    </div>
  )
}
