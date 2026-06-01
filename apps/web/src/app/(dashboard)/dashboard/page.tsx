import { createSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StatusBadge, UrgencyBadge } from '@/components/ui/badges'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { IncidenceUrgency, IncidenceStatus } from '@residrix/types'
import { OnboardingChecklist } from './_components/OnboardingChecklist'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  const [
    openResult,
    criticalResult,
    communitiesResult,
    recentResult,
    resolvedResult,
    invitationsResult,
    announcementsResult,
  ] = await Promise.all([
    supabase.from('incidences').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    supabase.from('incidences').select('id', { count: 'exact', head: true }).eq('urgency', 'critical').neq('status', 'closed'),
    supabase.from('communities').select('id', { count: 'exact', head: true }),
    supabase.from('incidences').select('id, title, status, urgency, created_at, communities(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('incidences').select('id', { count: 'exact', head: true }).eq('status', 'resolved').gte('resolved_at', new Date(new Date().setDate(1)).toISOString()),
    supabase.from('invitations').select('id', { count: 'exact', head: true }),
    supabase.from('announcements').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Incidencias abiertas', value: openResult.count ?? 0,      color: 'text-blue-400' },
    { label: 'Críticas activas',     value: criticalResult.count ?? 0,  color: 'text-red-400' },
    { label: 'Comunidades',          value: communitiesResult.count ?? 0, color: 'text-indigo-400' },
    { label: 'Resueltas este mes',   value: resolvedResult.count ?? 0,  color: 'text-green-400' },
  ]

  const recent = recentResult.data ?? []

  const hasCommunity = (communitiesResult.count ?? 0) > 0
  const hasInvitation = (invitationsResult.count ?? 0) > 0
  const hasAnnouncement = (announcementsResult.count ?? 0) > 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-ink-soft text-sm mt-1">Resumen de actividad de tus comunidades</p>
      </div>

      <OnboardingChecklist
        hasCommunity={hasCommunity}
        hasInvitation={hasInvitation}
        hasAnnouncement={hasAnnouncement}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="glass rounded-xl p-5">
            <p className="text-ink-soft text-sm">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl">
        <div className="px-6 py-4 border-b border-[color:var(--glass-border)] flex items-center justify-between">
          <h2 className="text-ink font-semibold text-sm">Últimas incidencias</h2>
          <Link href="/incidencias" className="text-indigo-400 text-xs hover:text-brand-soft transition-colors">
            Ver todas →
          </Link>
        </div>
        <div className="divide-y divide-[color:var(--glass-border)]">
          {recent.length === 0 && (
            <p className="px-6 py-8 text-center text-ink-faint text-sm">No hay incidencias aún</p>
          )}
          {recent.map((inc) => (
            <Link key={inc.id} href={`/incidencias/${inc.id}`} className="flex items-center gap-4 px-6 py-4 hover:glass transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-ink text-sm font-medium truncate">{inc.title}</p>
                <p className="text-ink-faint text-xs mt-0.5">
                  {(inc.communities as { name: string } | null)?.name ?? '—'} ·{' '}
                  {formatDistanceToNow(new Date(inc.created_at ?? Date.now()), { addSuffix: true, locale: es })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <UrgencyBadge urgency={inc.urgency as IncidenceUrgency} />
                <StatusBadge status={inc.status as IncidenceStatus} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
