import Link from 'next/link'

interface MeetingRow {
  id: string
  title: string
  meeting_date: string
  status: string
  audio_duration_seconds: number | null
  error_message: string | null
  created_at: string | null
  communities: { name: string } | null
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

const STATUS_STYLES: Record<string, { label: string; tone: string }> = {
  pending: { label: 'En cola', tone: 'text-ink-soft bg-zinc-700/40 border-zinc-600/40' },
  transcribing: { label: 'Transcribiendo', tone: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30' },
  transcribed: { label: 'Transcrita', tone: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30' },
  summarizing: { label: 'Resumiendo', tone: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30' },
  completed: { label: 'Lista', tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  failed: { label: 'Falló', tone: 'text-red-300 bg-red-500/10 border-red-500/30' },
}

export function MeetingsTable({ meetings }: { meetings: MeetingRow[] }) {
  if (meetings.length === 0) {
    return (
      <div className="glass rounded-xl px-6 py-16 text-center">
        <p className="text-ink-soft text-sm mb-1">Aún no has subido ninguna junta.</p>
        <p className="text-ink-faint text-xs">Pulsa "Subir audio" para empezar.</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="glass border-b border-[color:var(--glass-border)]">
          <tr className="text-left text-ink-faint text-xs uppercase tracking-wide">
            <th className="px-6 py-3 font-medium">Fecha</th>
            <th className="px-6 py-3 font-medium">Junta</th>
            <th className="px-6 py-3 font-medium hidden md:table-cell">Comunidad</th>
            <th className="px-6 py-3 font-medium hidden lg:table-cell">Duración</th>
            <th className="px-6 py-3 font-medium">Estado</th>
            <th className="px-6 py-3 font-medium text-right">·</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {meetings.map((m) => {
            const style = STATUS_STYLES[m.status] ?? STATUS_STYLES.pending
            return (
              <tr key={m.id} className="hover:glass">
                <td className="px-6 py-3 text-ink-soft text-xs whitespace-nowrap">{dateLabel(m.meeting_date)}</td>
                <td className="px-6 py-3">
                  <p className="text-ink">{m.title}</p>
                  {m.error_message && m.status === 'failed' && (
                    <p className="text-red-400 text-xs mt-0.5 line-clamp-1">{m.error_message}</p>
                  )}
                </td>
                <td className="px-6 py-3 hidden md:table-cell text-ink-soft text-xs">
                  {m.communities?.name ?? '—'}
                </td>
                <td className="px-6 py-3 hidden lg:table-cell text-ink-soft text-xs tabular-nums">
                  {durationLabel(m.audio_duration_seconds)}
                </td>
                <td className="px-6 py-3">
                  <span className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded border ${style.tone}`}>
                    {style.label}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <Link
                    href={`/juntas/${m.id}`}
                    className="text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    Abrir →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
