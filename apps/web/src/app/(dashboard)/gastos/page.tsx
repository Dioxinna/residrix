import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { firmHasFeature } from '@/lib/auth/feature-gate'
import { FeatureLock } from '@/components/feature-gate/FeatureLock'
import {
  currentMonthIso,
  formatEuros,
  monthLabel,
  monthRange,
  previousMonthIso,
  yearRange,
} from '@/lib/expenses'
import { ExpenseDialog } from './_components/ExpenseDialog'
import { ExpensesTable } from './_components/ExpensesTable'
import { MonthPicker } from './_components/MonthPicker'

export const metadata = { title: 'Gastos · Residrix' }

interface PageProps {
  searchParams: Promise<{ community?: string; month?: string }>
}

export default async function GastosPage({ searchParams }: PageProps) {
  const allowed = await firmHasFeature('expenses')
  if (!allowed) {
    return (
      <FeatureLock
        feature="expenses"
        description="Registro de gastos por comunidad con totales mensuales y anuales. La base para luego generar liquidaciones."
      />
    )
  }

  const params = await searchParams
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

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .eq('firm_id', profile.firm_id)
    .order('name')

  if (!communities || communities.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink mb-2">Gastos</h1>
        <p className="text-ink-soft mb-6">
          Crea una comunidad primero para registrar gastos.
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

  const selectedCommunityId = params.community && communities.some((c) => c.id === params.community)
    ? params.community
    : communities[0].id
  const selectedMonth = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonthIso()
  const prevMonth = previousMonthIso(selectedMonth)

  const monthBounds = monthRange(selectedMonth)
  const prevBounds = monthRange(prevMonth)
  const yearBounds = yearRange(selectedMonth)

  const [thisMonthRes, lastMonthRes, ytdRes, listRes] = await Promise.all([
    supabase
      .from('expenses')
      .select('amount_cents, paid_at')
      .eq('community_id', selectedCommunityId)
      .gte('expense_date', monthBounds.from)
      .lt('expense_date', monthBounds.toExclusive),
    supabase
      .from('expenses')
      .select('amount_cents')
      .eq('community_id', selectedCommunityId)
      .gte('expense_date', prevBounds.from)
      .lt('expense_date', prevBounds.toExclusive),
    supabase
      .from('expenses')
      .select('amount_cents')
      .eq('community_id', selectedCommunityId)
      .gte('expense_date', yearBounds.from)
      .lt('expense_date', yearBounds.toExclusive),
    supabase
      .from('expenses')
      .select('id, amount_cents, category, description, expense_date, paid_at, vendor_name, notes')
      .eq('community_id', selectedCommunityId)
      .gte('expense_date', monthBounds.from)
      .lt('expense_date', monthBounds.toExclusive)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  const thisMonthRows = thisMonthRes.data ?? []
  const thisMonthTotal = thisMonthRows.reduce((s, e) => s + e.amount_cents, 0)
  const paidTotal = thisMonthRows.filter((e) => e.paid_at).reduce((s, e) => s + e.amount_cents, 0)
  const unpaidTotal = thisMonthTotal - paidTotal
  const lastMonthTotal = (lastMonthRes.data ?? []).reduce((s, e) => s + e.amount_cents, 0)
  const ytdTotal = (ytdRes.data ?? []).reduce((s, e) => s + e.amount_cents, 0)
  const delta = lastMonthTotal === 0 ? null : ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-ink">Gastos</h1>
        <ExpenseDialog
          mode="create"
          trigger="Nuevo gasto"
          communityId={selectedCommunityId}
          firmId={profile.firm_id}
        />
      </div>
      <p className="text-sm text-ink-soft mb-6">
        Lleva el registro mensual de gastos por comunidad. Será la base de las Liquidaciones (Pro).
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <CommunityFilter
          communities={communities}
          selectedId={selectedCommunityId}
          selectedMonth={selectedMonth}
        />
        <MonthPicker selectedMonth={selectedMonth} selectedCommunityId={selectedCommunityId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
        <Stat label={monthLabel(selectedMonth)} value={formatEuros(thisMonthTotal)} accent />
        <Stat
          label="Pendiente de pago"
          value={formatEuros(unpaidTotal)}
          tone={unpaidTotal > 0 ? 'text-amber-700 dark:text-amber-300' : undefined}
          sub={paidTotal > 0 ? `${formatEuros(paidTotal)} pagado` : undefined}
        />
        <Stat
          label={`vs ${monthLabel(prevMonth)}`}
          value={formatEuros(lastMonthTotal)}
          sub={
            delta === null
              ? 'Sin gastos previos'
              : `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%`
          }
          tone={delta === null ? undefined : delta > 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}
        />
        <Stat label="Total año en curso" value={formatEuros(ytdTotal)} />
      </div>

      <ExpensesTable
        expenses={listRes.data ?? []}
        communityId={selectedCommunityId}
        firmId={profile.firm_id}
      />
    </div>
  )
}

function CommunityFilter({
  communities,
  selectedId,
  selectedMonth,
}: {
  communities: { id: string; name: string }[]
  selectedId: string
  selectedMonth: string
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-ink-faint uppercase tracking-wide">Comunidad</span>
      <div className="flex flex-wrap gap-1.5">
        {communities.map((c) => {
          const active = c.id === selectedId
          return (
            <Link
              key={c.id}
              href={`/gastos?community=${c.id}&month=${selectedMonth}`}
              scroll={false}
              className={`text-xs px-2.5 py-1 rounded border ${
                active
                  ? 'bg-brand/15 border-brand/40 text-ink'
                  : 'glass border-[color:var(--glass-border)] text-ink-soft hover:text-ink hover:border-[color:var(--glass-border)]'
              }`}
            >
              {c.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
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
        accent ? 'bg-indigo-500/5 border-indigo-500/30' : 'glass border-[color:var(--glass-border)]'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wide text-ink-faint mb-1">{label}</p>
      <p className={`text-lg font-semibold ${tone ?? 'text-ink'}`}>{value}</p>
      {sub && <p className="text-xs text-ink-faint mt-0.5">{sub}</p>}
    </div>
  )
}
