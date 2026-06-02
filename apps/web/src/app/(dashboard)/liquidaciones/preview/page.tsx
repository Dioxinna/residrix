import { redirect, notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { firmHasFeature } from '@/lib/auth/feature-gate'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import {
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_CATEGORY_ORDER,
  formatDateEs,
  formatEuros,
  inclusiveEndLabel,
  type ExpenseCategory,
} from '@/lib/expenses'
import { PreviewActions } from '../_components/PreviewActions'

export const metadata = { title: 'Liquidación · Residrix' }

interface PageProps {
  searchParams: Promise<{ community?: string; from?: string; to?: string }>
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export default async function LiquidacionPreviewPage({ searchParams }: PageProps) {
  const allowed = await firmHasFeature('settlements')
  if (!allowed) return <FeatureLock feature="settlements" />

  const params = await searchParams
  if (!params.community || !params.from || !params.to) notFound()
  if (!ISO_DATE.test(params.from) || !ISO_DATE.test(params.to)) notFound()

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
        <p className="text-ink-soft text-sm">Esta página es solo para administradores.</p>
      </div>
    )
  }

  const [{ data: community }, { data: firm }] = await Promise.all([
    supabase
      .from('communities')
      .select('id, name, address, city, postal_code, firm_id')
      .eq('id', params.community)
      .single(),
    supabase
      .from('firms')
      .select('name, email, phone')
      .eq('id', profile.firm_id)
      .single(),
  ])

  if (!community || community.firm_id !== profile.firm_id) notFound()

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, amount_cents, category, description, expense_date, paid_at, vendor_name, notes')
    .eq('community_id', community.id)
    .gte('expense_date', params.from)
    .lt('expense_date', params.to)
    .order('expense_date', { ascending: true })
    .order('created_at', { ascending: true })

  const rows = expenses ?? []
  const totalCents = rows.reduce((s, e) => s + e.amount_cents, 0)
  const paidCents = rows.filter((e) => e.paid_at).reduce((s, e) => s + e.amount_cents, 0)
  const unpaidCents = totalCents - paidCents

  const byCategory = new Map<string, { count: number; total: number }>()
  for (const e of rows) {
    const current = byCategory.get(e.category) ?? { count: 0, total: 0 }
    current.count += 1
    current.total += e.amount_cents
    byCategory.set(e.category, current)
  }
  const categoryRows = EXPENSE_CATEGORY_ORDER
    .map((c) => ({ category: c, ...(byCategory.get(c) ?? { count: 0, total: 0 }) }))
    .filter((r) => r.count > 0)

  const issuedAt = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  const periodLabel = `del ${formatDateEs(params.from)} al ${inclusiveEndLabel(params.to)}`

  return (
    <>
      {/* Print CSS: oculta sidebar y controles, ajusta colores para papel */}
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
          from={params.from}
          to={params.to}
          communityName={community.name}
        />

        {/* HEADER */}
        <header className="border-b border-[color:var(--glass-border)] pb-5 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-faint print-muted mb-1">Informe de gastos</p>
              <h1 className="text-2xl font-bold text-ink">{community.name}</h1>
              <p className="text-sm text-ink-soft print-muted mt-0.5">
                {community.address}, {community.postal_code} {community.city}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-ink font-semibold">{firm?.name}</p>
              {firm?.email && <p className="text-xs text-ink-faint print-muted">{firm.email}</p>}
              {firm?.phone && <p className="text-xs text-ink-faint print-muted">{firm.phone}</p>}
            </div>
          </div>
          <p className="text-sm text-ink-soft mt-3">
            Periodo: <strong className="text-ink">{periodLabel}</strong>
          </p>
          <p className="text-xs text-ink-faint print-muted">Emitido el {issuedAt} por {profile.full_name}</p>
        </header>

        {/* TOTALES */}
        <section className="grid grid-cols-3 gap-3 mb-8">
          <Stat label="Total del periodo" value={formatEuros(totalCents)} accent />
          <Stat label="Pagado" value={formatEuros(paidCents)} tone="text-emerald-700 dark:text-emerald-300" />
          <Stat label="Pendiente" value={formatEuros(unpaidCents)} tone={unpaidCents > 0 ? 'text-amber-700 dark:text-amber-300' : undefined} />
        </section>

        {/* BREAKDOWN POR CATEGORÍA */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-3">Resumen por categoría</h2>
          {categoryRows.length === 0 ? (
            <p className="text-sm text-ink-faint italic">Sin gastos en este periodo.</p>
          ) : (
            <table className="w-full text-sm border border-[color:var(--glass-border)] rounded overflow-hidden">
              <thead className="bg-[color:var(--c-surface)] border-b border-[color:var(--glass-border)]">
                <tr className="text-left text-ink-faint text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 font-medium">Categoría</th>
                  <th className="px-4 py-2 font-medium text-right">Nº gastos</th>
                  <th className="px-4 py-2 font-medium text-right">Total</th>
                  <th className="px-4 py-2 font-medium text-right">% del periodo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--glass-border)]">
                {categoryRows.map((r) => (
                  <tr key={r.category}>
                    <td className="px-4 py-2 text-ink">
                      {EXPENSE_CATEGORY_LABEL[r.category as ExpenseCategory] ?? 'Otros'}
                    </td>
                    <td className="px-4 py-2 text-right text-ink-soft tabular-nums">{r.count}</td>
                    <td className="px-4 py-2 text-right text-ink tabular-nums">{formatEuros(r.total)}</td>
                    <td className="px-4 py-2 text-right text-ink-soft tabular-nums">
                      {totalCents === 0 ? '—' : `${((r.total / totalCents) * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[color:var(--c-surface)] border-t border-[color:var(--glass-border)]">
                <tr>
                  <td className="px-4 py-2 text-ink font-semibold uppercase text-xs tracking-wide">Total</td>
                  <td className="px-4 py-2 text-right text-ink-soft tabular-nums">{rows.length}</td>
                  <td className="px-4 py-2 text-right text-ink font-semibold tabular-nums">{formatEuros(totalCents)}</td>
                  <td className="px-4 py-2 text-right text-ink-soft tabular-nums">100%</td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {/* DETALLE */}
        {rows.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-3">Detalle</h2>
            <table className="w-full text-sm border border-[color:var(--glass-border)] rounded overflow-hidden">
              <thead className="bg-[color:var(--c-surface)] border-b border-[color:var(--glass-border)]">
                <tr className="text-left text-ink-faint text-xs uppercase tracking-wide">
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Descripción</th>
                  <th className="px-3 py-2 font-medium">Categoría</th>
                  <th className="px-3 py-2 font-medium">Proveedor</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--glass-border)]">
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td className="px-3 py-2 text-ink-soft text-xs whitespace-nowrap">{formatDateEs(e.expense_date)}</td>
                    <td className="px-3 py-2 text-ink">{e.description}</td>
                    <td className="px-3 py-2 text-ink-soft text-xs">
                      {EXPENSE_CATEGORY_LABEL[e.category as ExpenseCategory] ?? 'Otros'}
                    </td>
                    <td className="px-3 py-2 text-ink-soft text-xs">{e.vendor_name ?? '—'}</td>
                    <td className="px-3 py-2 text-xs">
                      {e.paid_at ? (
                        <span className="text-emerald-700 dark:text-emerald-300">Pagado</span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-300">Pendiente</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-ink tabular-nums whitespace-nowrap">
                      {formatEuros(e.amount_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* FOOTER */}
        <footer className="border-t border-[color:var(--glass-border)] pt-4 text-xs text-ink-faint print-muted">
          <p>
            Informe generado automáticamente por Residrix a partir del registro de gastos de la comunidad.
            Este documento refleja únicamente los gastos registrados; los ingresos por cuotas se gestionan al margen.
          </p>
        </footer>
      </div>
    </>
  )
}

function Stat({ label, value, tone, accent }: { label: string; value: string; tone?: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        accent ? 'bg-violet-500/5 border-violet-500/30' : 'bg-[color:var(--c-surface)] border-[color:var(--glass-border)]'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wide text-ink-faint print-muted mb-1">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${tone ?? 'text-ink'}`}>{value}</p>
    </div>
  )
}
