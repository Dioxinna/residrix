export type ExpenseCategory =
  | 'suministros'
  | 'limpieza'
  | 'mantenimiento'
  | 'ascensor'
  | 'seguros'
  | 'administracion'
  | 'jardineria'
  | 'obras'
  | 'otros'

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  suministros: 'Suministros',
  limpieza: 'Limpieza',
  mantenimiento: 'Mantenimiento',
  ascensor: 'Ascensor',
  seguros: 'Seguros',
  administracion: 'Administración',
  jardineria: 'Jardinería',
  obras: 'Obras',
  otros: 'Otros',
}

export const EXPENSE_CATEGORY_ORDER: ExpenseCategory[] = [
  'suministros',
  'limpieza',
  'mantenimiento',
  'ascensor',
  'seguros',
  'administracion',
  'jardineria',
  'obras',
  'otros',
]

const CATEGORY_TONES: Record<ExpenseCategory, string> = {
  suministros: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  limpieza: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  mantenimiento: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  ascensor: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  seguros: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  administracion: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
  jardineria: 'bg-lime-500/10 text-lime-300 border-lime-500/30',
  obras: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  otros: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30',
}

export function categoryTone(category: string): string {
  return CATEGORY_TONES[category as ExpenseCategory] ?? CATEGORY_TONES.otros
}

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function parseEurosToCents(value: string): number | null {
  const cleaned = value.trim().replace(/\./g, '').replace(',', '.')
  const num = Number(cleaned)
  if (!isFinite(num) || num < 0) return null
  return Math.round(num * 100)
}

export function currentMonthIso(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function previousMonthIso(monthIso: string): string {
  const [y, m] = monthIso.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 2, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function monthRange(monthIso: string): { from: string; toExclusive: string } {
  const [y, m] = monthIso.split('-').map(Number)
  const from = `${y}-${String(m).padStart(2, '0')}-01`
  const next = new Date(Date.UTC(y, m, 1))
  const toExclusive = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-01`
  return { from, toExclusive }
}

export function yearRange(monthIso: string): { from: string; toExclusive: string } {
  const [y] = monthIso.split('-').map(Number)
  return { from: `${y}-01-01`, toExclusive: `${y + 1}-01-01` }
}

export function monthLabel(monthIso: string): string {
  const [y, m] = monthIso.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}
