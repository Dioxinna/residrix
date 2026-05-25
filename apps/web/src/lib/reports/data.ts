// Cómputo del informe mensual de una comunidad. Pure data — no UI.
// Lo usan /informes/preview (server component) y el cron de emails.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@residrix/supabase'
import { monthRange, previousMonthIso, monthLabel } from '@/lib/expenses'

type SB = SupabaseClient<Database>

const TERMINAL_STATUS = new Set(['resolved', 'closed'])
const URGENCY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export interface MonthlyReportKPIs {
  incidentsTotal: number
  incidentsResolved: number
  incidentsOpen: number
  avgResolutionMs: number | null
  expensesTotal: number
  expensesPaid: number
  expensesUnpaid: number
  incidentsDelta: number | null
  expensesDelta: number | null
  prevIncidentsCount: number
  prevExpensesTotal: number
}

export interface BreakdownRow {
  key: string
  count: number
}

export interface ExpenseCategoryRow {
  category: string
  count: number
  total: number
}

export interface TopIncidence {
  id: string
  title: string
  category: string
  urgency: string
  status: string
  created_at: string
  resolved_at: string | null
}

export interface MonthlyReportData {
  month: string                // YYYY-MM
  monthLabel: string
  prevMonth: string
  prevMonthLabel: string
  community: {
    id: string
    name: string
    address: string
    city: string
    postal_code: string
    units_count: number
  }
  kpis: MonthlyReportKPIs
  incidentsByCategory: BreakdownRow[]
  incidentsByUrgency: BreakdownRow[]
  topIncidents: TopIncidence[]
  expensesByCategory: ExpenseCategoryRow[]
}

export async function fetchMonthlyReport(
  supabase: SB,
  communityId: string,
  month: string,
): Promise<MonthlyReportData | null> {
  const { data: community } = await supabase
    .from('communities')
    .select('id, name, address, city, postal_code, units_count, firm_id')
    .eq('id', communityId)
    .single()
  if (!community) return null

  const prevMonth = previousMonthIso(month)
  const bounds = monthRange(month)
  const prevBounds = monthRange(prevMonth)

  const [incRes, expRes, prevIncRes, prevExpRes] = await Promise.all([
    supabase
      .from('incidences')
      .select('id, title, category, urgency, status, created_at, resolved_at')
      .eq('community_id', communityId)
      .gte('created_at', bounds.from)
      .lt('created_at', bounds.toExclusive)
      .order('created_at', { ascending: true }),
    supabase
      .from('expenses')
      .select('amount_cents, category, paid_at')
      .eq('community_id', communityId)
      .gte('expense_date', bounds.from)
      .lt('expense_date', bounds.toExclusive),
    supabase
      .from('incidences')
      .select('id', { count: 'exact', head: true })
      .eq('community_id', communityId)
      .gte('created_at', prevBounds.from)
      .lt('created_at', prevBounds.toExclusive),
    supabase
      .from('expenses')
      .select('amount_cents')
      .eq('community_id', communityId)
      .gte('expense_date', prevBounds.from)
      .lt('expense_date', prevBounds.toExclusive),
  ])

  const incidences = incRes.data ?? []
  const expenses = expRes.data ?? []
  const prevIncidentsCount = prevIncRes.count ?? 0
  const prevExpensesTotal = (prevExpRes.data ?? []).reduce((s, e) => s + e.amount_cents, 0)

  // --- KPIs incidencias ---
  const incTerminal = incidences.filter((i) => TERMINAL_STATUS.has(i.status))
  const resolutionTimes = incTerminal
    .filter((i) => i.resolved_at)
    .map((i) => {
      const start = new Date(i.created_at as string).getTime()
      const end = new Date(i.resolved_at as string).getTime()
      return Math.max(0, end - start)
    })
  const avgResolutionMs = resolutionTimes.length === 0
    ? null
    : resolutionTimes.reduce((s, n) => s + n, 0) / resolutionTimes.length

  const incidentsByCategoryMap = new Map<string, number>()
  const incidentsByUrgencyMap = new Map<string, number>()
  for (const i of incidences) {
    incidentsByCategoryMap.set(i.category, (incidentsByCategoryMap.get(i.category) ?? 0) + 1)
    incidentsByUrgencyMap.set(i.urgency, (incidentsByUrgencyMap.get(i.urgency) ?? 0) + 1)
  }

  const topIncidents: TopIncidence[] = [...incidences]
    .sort((a, b) => {
      const u = (URGENCY_RANK[a.urgency] ?? 9) - (URGENCY_RANK[b.urgency] ?? 9)
      if (u !== 0) return u
      return new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime()
    })
    .slice(0, 5)
    .map((i) => ({
      id: i.id,
      title: i.title,
      category: i.category,
      urgency: i.urgency,
      status: i.status,
      created_at: i.created_at as string,
      resolved_at: i.resolved_at,
    }))

  const incidentsDelta = prevIncidentsCount === 0
    ? null
    : ((incidences.length - prevIncidentsCount) / prevIncidentsCount) * 100

  // --- KPIs gastos ---
  const expensesTotal = expenses.reduce((s, e) => s + e.amount_cents, 0)
  const expensesPaid = expenses.filter((e) => e.paid_at).reduce((s, e) => s + e.amount_cents, 0)
  const expensesUnpaid = expensesTotal - expensesPaid
  const expByCatMap = new Map<string, { count: number; total: number }>()
  for (const e of expenses) {
    const cur = expByCatMap.get(e.category) ?? { count: 0, total: 0 }
    cur.count += 1
    cur.total += e.amount_cents
    expByCatMap.set(e.category, cur)
  }
  const expensesByCategory: ExpenseCategoryRow[] = [...expByCatMap.entries()]
    .map(([category, v]) => ({ category, count: v.count, total: v.total }))
    .sort((a, b) => b.total - a.total)

  const expensesDelta = prevExpensesTotal === 0
    ? null
    : ((expensesTotal - prevExpensesTotal) / prevExpensesTotal) * 100

  return {
    month,
    monthLabel: monthLabel(month),
    prevMonth,
    prevMonthLabel: monthLabel(prevMonth),
    community: {
      id: community.id,
      name: community.name,
      address: community.address,
      city: community.city,
      postal_code: community.postal_code,
      units_count: community.units_count,
    },
    kpis: {
      incidentsTotal: incidences.length,
      incidentsResolved: incTerminal.length,
      incidentsOpen: incidences.length - incTerminal.length,
      avgResolutionMs,
      expensesTotal,
      expensesPaid,
      expensesUnpaid,
      incidentsDelta,
      expensesDelta,
      prevIncidentsCount,
      prevExpensesTotal,
    },
    incidentsByCategory: [...incidentsByCategoryMap.entries()].map(([key, count]) => ({ key, count })),
    incidentsByUrgency: (['critical', 'high', 'medium', 'low'] as const)
      .filter((u) => incidentsByUrgencyMap.has(u))
      .map((u) => ({ key: u, count: incidentsByUrgencyMap.get(u) ?? 0 })),
    topIncidents,
    expensesByCategory,
  }
}

export function formatResolutionDuration(ms: number): string {
  const hours = ms / 3600000
  if (hours < 24) return `${hours.toFixed(1)} h`
  const days = hours / 24
  if (days < 14) return `${days.toFixed(1)} días`
  const weeks = days / 7
  return `${weeks.toFixed(1)} sem`
}
