import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { firmHasFeature } from '@/lib/auth/feature-gate'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import { StatusPoller } from './_components/StatusPoller'
import { RetryButton } from './_components/RetryButton'

export const metadata = { title: 'Junta · Residrix' }

const TERMINAL = new Set(['completed', 'failed'])

interface PageProps {
  params: Promise<{ id: string }>
}

function dateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function durationLabel(seconds: number | null): string {
  if (!seconds) return '—'
  const min = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${min}:${String(s).padStart(2, '0')}`
}

export default async function MeetingDetailPage({ params }: PageProps) {
  const allowed = await firmHasFeature('meeting_transcripts')
  if (!allowed) return <FeatureLock feature="meeting_transcripts" />

  const { id } = await params

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

  const { data: meeting } = await supabase
    .from('meetings')
    .select(
      'id, title, meeting_date, status, audio_path, audio_size_bytes, audio_duration_seconds, transcript, summary, error_message, firm_id, communities(name)',
    )
    .eq('id', id)
    .single()

  if (!meeting || meeting.firm_id !== profile.firm_id) notFound()

  // Signed URL para el reproductor (1 hora). Service client porque las
  // policies del bucket exigen admin role en la sesión y queremos firmar
  // sin reñir con la cookie.
  const service = createSupabaseServiceClient()
  const { data: signed } = await service
    .storage
    .from('meeting-audios')
    .createSignedUrl(meeting.audio_path, 3600)
  const audioUrl = signed?.signedUrl ?? null

  const isTerminal = TERMINAL.has(meeting.status)
  const community = (meeting.communities ?? null) as { name: string } | null

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link
        href="/juntas"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-6"
      >
        <ArrowLeft size={14} /> Volver a juntas
      </Link>

      <header className="border-b border-[color:var(--glass-border)] pb-5 mb-6">
        <p className="text-[10px] uppercase tracking-widest text-ink-faint mb-1">Acta de junta</p>
        <h1 className="text-2xl font-bold text-ink">{meeting.title}</h1>
        <p className="text-sm text-ink-soft mt-1">
          {community?.name ?? '—'} · {dateLabel(meeting.meeting_date)}
          {meeting.audio_duration_seconds && ` · ${durationLabel(meeting.audio_duration_seconds)} de audio`}
        </p>
      </header>

      {!isTerminal && <StatusPoller status={meeting.status} />}

      {meeting.status === 'failed' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
          <AlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-0.5">Falló el procesamiento</p>
            <p className="text-xs text-red-400/80 break-words">
              {meeting.error_message ?? 'Error desconocido'}
            </p>
          </div>
          <RetryButton meetingId={meeting.id} />
        </div>
      )}

      {audioUrl && (
        <section className="mb-6">
          <p className="text-xs uppercase tracking-wide text-ink-faint mb-2 font-semibold">Audio original</p>
          <audio controls src={audioUrl} className="w-full" preload="none" />
        </section>
      )}

      {meeting.summary && (
        <section className="glass rounded-xl p-6 mb-6">
          <p className="text-xs uppercase tracking-wide text-ink-faint mb-3 font-semibold">Acta resumida</p>
          <MarkdownSummary text={meeting.summary} />
        </section>
      )}

      {meeting.transcript && (
        <details className="glass rounded-xl">
          <summary className="cursor-pointer px-6 py-4 text-sm text-ink-soft font-medium hover:glass">
            Transcripción completa
          </summary>
          <div className="px-6 pb-6 pt-2 text-sm text-ink-soft whitespace-pre-wrap leading-relaxed">
            {meeting.transcript}
          </div>
        </details>
      )}

      {!meeting.transcript && !meeting.summary && (
        <div className="glass rounded-xl px-6 py-16 text-center">
          <p className="text-ink-soft text-sm">
            {meeting.status === 'failed'
              ? 'No se pudo procesar el audio.'
              : 'Procesando audio… esto suele tardar 1-3 minutos.'}
          </p>
        </div>
      )}
    </div>
  )
}

// Minimal markdown renderer suficiente para la salida que generamos
// (encabezados ##, listas - y -, **bold**). Evitamos añadir dependencia.
function MarkdownSummary({ text }: { text: string }) {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let listBuffer: string[] = []

  function flushList(key: number) {
    if (listBuffer.length === 0) return
    nodes.push(
      <ul key={`l-${key}`} className="list-disc pl-5 space-y-1 text-sm text-ink-soft mb-4">
        {listBuffer.map((item, idx) => (
          <li key={idx}>{renderInline(item)}</li>
        ))}
      </ul>,
    )
    listBuffer = []
  }

  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line) {
      flushList(i)
      return
    }
    if (line.startsWith('## ')) {
      flushList(i)
      nodes.push(
        <h2 key={`h-${i}`} className="text-ink font-semibold text-base mt-5 first:mt-0 mb-2">
          {line.replace(/^##\s+/, '')}
        </h2>,
      )
      return
    }
    if (line.startsWith('### ')) {
      flushList(i)
      nodes.push(
        <h3 key={`h-${i}`} className="text-ink font-semibold text-sm mt-3 mb-1">
          {line.replace(/^###\s+/, '')}
        </h3>,
      )
      return
    }
    if (/^[-*]\s+/.test(line)) {
      listBuffer.push(line.replace(/^[-*]\s+/, ''))
      return
    }
    flushList(i)
    nodes.push(
      <p key={`p-${i}`} className="text-sm text-ink-soft leading-relaxed mb-3">
        {renderInline(line)}
      </p>,
    )
  })
  flushList(lines.length)
  return <div>{nodes}</div>
}

function renderInline(text: string): React.ReactNode {
  // **bold** → <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="text-ink font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}
