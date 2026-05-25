import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { firmHasFeature } from '@/lib/auth/feature-gate'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import {
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_CATEGORY_ORDER,
  formatDateEs,
  formatEuros,
  monthLabel,
  monthRange,
  previousMonthIso,
  type ExpenseCategory,
} from '@/lib/expenses'
import { PreviewActions } from '../../liquidaciones/_components/PreviewActions'

export const metadata = { title: 'Informe mensual · Residrix' }

const MONTH_ISO = /^\d{4}-\d{2}$/

const INCIDENCE_CATEGORY_LABEL: Record<string, string> = {
  plumbing: 'Fontanería',
  electricity: 'Electricidad',
  cleaning: 'Limpieza',
  elevator: 'Ascensor',
  structure: 'Estructura',
  access: 'Acceso',
  noise: 'Ruido',
  other: 'Otros',
}

const URGENCY_LABEL: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const URGENCY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const TERMINAL_STATUS = new Set(['resolved', 'closed'])

interface PageProps {
  searchParams: Promise<{ community?: string; month?: string }>
}

export default async function InformePreviewPage({ searchParams }: PageProps) {
  const allowed = await firmHasFeature('auto_reports')
  if (!allowed) return <FeatureLock feature="auto_reports" />

  const params = await searchParams
  if (!params.community || !params.month || !MONTH_ISO.test(params.month)) notFound()

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id, full_name')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin' || !profile.firm_id) {
    return (
      <div className="px-6 py-10">
        <p className="text-zinc-400 text-sm">Esta página es solo para administradores.</p>
      </div>
    )
  }

  const [{ data: community }, { data: firm }] = await Promise.all([
    supabase
      .from('communities')
      .select('id, name, address, city, postal_code, firm_id, units_count')
      .eq('id', params.community)
      .single(),
    supabase
      .from('firms')
      .select('name, email, phone')
      .eq('id', profile.firm_id)
      .single(),
  ])

  if (!community || community.firm_id !== profile.firm_id) notFound()

  const month = params.month
  const prevMonth = previousMonthIso(month)
  const bounds = monthRange(month)
  const prevBounds = monthRange(prevMonth)

  const [incRes, expRes, prevIncRes, prevExpRes] = await Promise.all([
    supabase
      .from('incidences')
      .select('id, title, category, urgency, status, created_at, resolved_at')
      .eq('community_id', community.id)
      .gte('created_at', bounds.from)
      .lt('created_at', bounds.toExclusive)
      .order('created_at', { ascending: true }),
    supabase
      .from('expenses')
      .select('amount_cents, category, paid_at')
      .eq('community_id', community.id)
      .gte('expense_date', bounds.from)
      .lt('expense_date', bounds.toExclusive),
    supabase
      .from('incidences')
      .select('id', { count: 'exact', head: true })
      .eq('community_id', community.id)
      .gte('created_at', prevBounds.from)
      .lt('created_at', prevBounds.toExclusive),
    supabase
      .from('expenses')
      .select('amount_cents')
      .eq('community_id', community.id)
      .gte('expense_date', prevBounds.from)
      .lt('expense_date', prevBounds.toExclusive),
  ])

  const incidences = incRes.data ?? []
  const expenses = expRes.data ?? []
  const prevIncCount = prevIncRes.count ?? 0
  const prevExpTotal = (prevExpRes.data ?? []).reduce((s, e) => s + e.amount_cents, 0)

  // ---------- KPIs incidencias ----------
  const incTotal = incidences.length
  const incResolved = incidences.filter((i) => TERMINAL_STATUS.has(i.status))
  const incOpen = incTotal - incResolved.length
  const resolutionTimes = incResolved
    .filter((i) => i.resolved_at)
    .map((i) => {
      const start = new Date(i.created_at as string).getTime()
      const end = new Date(i.resolved_at as string).getTime()
      return Math.max(0, end - start)
    })
  const avgResolutionMs =
    resolutionTimes.length > 0
      ? resolutionTimes.reduce((s, n) => s + n, 0) / resolutionTimes.length
      : null
  const avgResolutionLabel = avgResolutionMs === null
    ? '—'
    : formatDuration(avgResolutionMs)

  const byCategory = new Map<string, number>()
  const byUrgency = new Map<string, number>()
  for (const i of incidences) {
    byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + 1)
    byUrgency.set(i.urgency, (byUrgency.get(i.urgency) ?? 0) + 1)
  }

  // Top 5: prioriza por urgencia, luego más antigua.
  const topIncidences = [...incidences]
    .sort((a, b) => {
      const u = (URGENCY_RANK[a.urgency] ?? 9) - (URGENCY_RANK[b.urgency] ?? 9)
      if (u !== 0) return u
      return new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime()
    })
    .slice(0, 5)

  const incDelta = prevIncCount === 0 ? null : ((incTotal - prevIncCount) / prevIncCount) * 100

  // ---------- KPIs gastos ----------
  const expTotal = expenses.reduce((s, e) => s + e.amount_cents, 0)
  const expPaid = expenses.filter((e) => e.paid_at).reduce((s, e) => s + e.amount_cents, 0)
  const expUnpaid = expTotal - expPaid
  const expByCat = new Map<string, { count: number; total: number }>()
  for (const e of expenses) {
    const cur = expByCat.get(e.category) ?? { count: 0, total: 0 }
    cur.count += 1
    cur.total += e.amount_cents
    expByCat.set(e.category, cur)
  }
  const expCatRows = EXPENSE_CATEGORY_ORDER
    .map((c) => ({ category: c, ...(expByCat.get(c) ?? { count: 0, total: 0 }) }))
    .filter((r) => r.count > 0)

  const expDelta = prevExpTotal === 0 ? null : ((expTotal - prevExpTotal) / prevExpTotal) * 100

  const issuedAt = new Date().toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // Reusa el endpoint CSV de Liquidaciones para gastos (PreviewActions
  // espera bounds en YYYY-MM-DD).
  return (
    <>
      <style>{`
        @media print {
          aside, .no-print { display: none !important; }
          main { overflow: visible !important; }
          body, .print-page { background: white !important; color: black !important; }
          .print-page * { color: black !important; border-color: #d4d4d8 !important; }
          .print-page .print-muted { color: #525252 !important; }
          .print-page table { page-break-inside: auto; }
          .print-page tr { page-break-inside: avoid; page-break-after: auto; }
          @page { margin: 18mm 14mm; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-6 py-8 print-page">
        <PreviewActions
          communityId={community.id}
          from={bounds.from}
          to={bounds.toExclusive}
          communityName={community.name}
        />

        {/* HEADER */}
        <header className="border-b border-zinc-800 pb-5 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 print-muted mb-1">
                Informe mensual
              </p>
              <h1 className="text-2xl font-bold text-white">{community.name}</h1>
              <p className="text-sm text-zinc-400 print-muted mt-0.5">
                {community.address}, {community.postal_code} {community.city}
                {community.units_count > 0 && ` · ${community.units_count} unidades`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white font-semibold">{firm?.name}</p>
              {firm?.email && <p className="text-xs text-zinc-500 print-muted">{firm.email}</p>}
              {firm?.phone && <p className="text-xs text-zinc-500 print-muted">{firm.phone}</p>}
            </div>
          </div>
          <p className="text-sm text-zinc-300 mt-3 capitalize">
            Periodo: <strong className="text-white">{monthLabel(month)}</strong>
          </p>
          <p className="text-xs text-zinc-500 print-muted">
            Emitido el {issuedAt} por {profile.full_name}
          </p>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat
            label="Incidencias del mes"
            value={String(incTotal)}
            sub={
              incDelta === null
                ? prevIncCount === 0 ? 'Sin precedente' : undefined
                : `${incDelta >= 0 ? '+' : ''}${incDelta.toFixed(0)}% vs ${monthLabel(prevMonth)}`
            }
            tone={incDelta === null ? undefined : incDelta > 0 ? 'text-amber-300' : 'text-emerald-300'}
            accent
          />
          <Stat
            label="Resueltas"
            value={`${incResolved.length} / ${incTotal}`}
            sub={incTotal === 0 ? '—' : `${((incResolved.length / incTotal) * 100).toFixed(0)}% del total`}
            tone="text-emerald-300"
          />
          <Stat
            label="Tiempo medio resolución"
            value={avgResolutionLabel}
            sub={resolutionTimes.length === 0 ? 'Sin datos' : `${resolutionTimes.length} resueltas`}
          />
          <Stat
            label="Gastos del mes"
            value={formatEuros(expTotal)}
            sub={
              expDelta === null
                ? prevExpTotal === 0 ? 'Sin precedente' : undefined
                : `${expDelta >= 0 ? '+' : ''}${expDelta.toFixed(0)}% vs ${monthLabel(prevMonth)}`
            }
            tone={expDelta === null ? undefined : expDelta > 0 ? 'text-amber-300' : 'text-emerald-300'}
          />
        </section>

        {/* INCIDENCIAS */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">Incidencias</h2>

          {incTotal === 0 ? (
            <p className="text-sm text-zinc-500 italic">Sin incidencias registradas este mes.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <BreakdownTable
                title="Por categoría"
                rows={[...byCategory.entries()].map(([k, v]) => ({
                  label: INCIDENCE_CATEGORY_LABEL[k] ?? k,
                  count: v,
                }))}
                total={incTotal}
              />
              <BreakdownTable
                title="Por urgencia"
                rows={(['critical', 'high', 'medium', 'low'] as const)
                  .filter((u) => byUrgency.has(u))
                  .map((u) => ({ label: URGENCY_LABEL[u], count: byUrgency.get(u) ?? 0 }))}
                total={incTotal}
              />
            </div>
          )}
        </section>

        {/* TOP 5 INCIDENCIAS */}
        {topIncidences.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
              Incidencias destacadas
            </h2>
            <table className="w-full text-sm border border-zinc-800 rounded overflow-hidden">
              <thead className="bg-zinc-950/50">
                <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide">
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Título</th>
                  <th className="px-3 py-2 font-medium">Categoría</th>
                  <th className="px-3 py-2 font-medium">Urgencia</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {topIncidences.map((i) => (
                  <tr key={i.id}>
                    <td className="px-3 py-2 text-zinc-400 text-xs whitespace-nowrap">
                      {formatDateEs((i.created_at as string).slice(0, 10))}
                    </td>
                    <td className="px-3 py-2 text-white">{i.title}</td>
                    <td className="px-3 py-2 text-zinc-400 text-xs">
                      {INCIDENCE_CATEGORY_LABEL[i.category] ?? i.category}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {URGENCY_LABEL[i.urgency] ?? i.urgency}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {TERMINAL_STATUS.has(i.status) ? (
                        <span className="text-emerald-400">Cerrada</span>
                      ) : (
                        <span className="text-amber-400">Abierta</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* GASTOS */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">Gastos</h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <MiniStat label="Total" value={formatEuros(expTotal)} accent />
            <MiniStat label="Pagado" value={formatEuros(expPaid)} tone="text-emerald-300" />
            <MiniStat
              label="Pendiente"
              value={formatEuros(expUnpaid)}
              tone={expUnpaid > 0 ? 'text-amber-300' : undefined}
            />
          </div>

          {expCatRows.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">Sin gastos registrados este mes.</p>
          ) : (
            <table className="w-full text-sm border border-zinc-800 rounded overflow-hidden">
              <thead className="bg-zinc-950/50">
                <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 font-medium">Categoría</th>
                  <th className="px-4 py-2 font-medium text-right">Nº</th>
                  <th className="px-4 py-2 font-medium text-right">Total</th>
                  <th className="px-4 py-2 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {expCatRows.map((r) => (
                  <tr key={r.category}>
                    <td className="px-4 py-2 text-white">
                      {EXPENSE_CATEGORY_LABEL[r.category as ExpenseCategory] ?? 'Otros'}
                    </td>
                    <td className="px-4 py-2 text-right text-zinc-400 tabular-nums">{r.count}</td>
                    <td className="px-4 py-2 text-right text-white tabular-nums">{formatEuros(r.total)}</td>
                    <td className="px-4 py-2 text-right text-zinc-400 tabular-nums">
                      {expTotal === 0 ? '—' : `${((r.total / expTotal) * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* FOOTER */}
        <footer className="border-t border-zinc-800 pt-4 text-xs text-zinc-500 print-muted">
          <p>
            Informe generado automáticamente por Residrix a partir de los datos de incidencias y gastos
            registrados. Los importes son los introducidos por la administración; las incidencias reflejan
            el estado en el momento de la generación del informe.
          </p>
        </footer>
      </div>
    </>
  )
}

function formatDuration(ms: number): string {
  const hours = ms / 3600000
  if (hours < 24) return `${hours.toFixed(1)} h`
  const days = hours / 24
  if (days < 14) return `${days.toFixed(1)} días`
  const weeks = days / 7
  return `${weeks.toFixed(1)} sem`
}

function Stat({
  label,
  value,
  sub,
  tone,
  accent,
}: {
  label: string
  value: string
  sub?: string
  tone?: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        accent ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wide text-zinc-500 print-muted mb-1">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${tone ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 print-muted mt-0.5">{sub}</p>}
    </div>
  )
}

function MiniStat({
  label,
  value,
  tone,
  accent,
}: {
  label: string
  value: string
  tone?: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        accent ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wide text-zinc-500 print-muted">{label}</p>
      <p className={`text-base font-semibold tabular-nums ${tone ?? 'text-white'}`}>{value}</p>
    </div>
  )
}

function BreakdownTable({
  title,
  rows,
  total,
}: {
  title: string
  rows: { label: string; count: number }[]
  total: number
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <p className="px-4 py-2 text-xs uppercase tracking-wide text-zinc-500 print-muted bg-zinc-950/50 border-b border-zinc-800">
        {title}
      </p>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-zinc-800">
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="px-4 py-1.5 text-white">{r.label}</td>
              <td className="px-4 py-1.5 text-right text-zinc-400 tabular-nums">{r.count}</td>
              <td className="px-4 py-1.5 text-right text-zinc-500 tabular-nums w-16">
                {total === 0 ? '—' : `${((r.count / total) * 100).toFixed(0)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
