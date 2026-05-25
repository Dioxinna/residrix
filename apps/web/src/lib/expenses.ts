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

export type PeriodPreset =
  | 'this_month'
  | 'last_month'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'ytd'
  | 'last_year'
  | 'custom'

export interface PeriodRange {
  from: string         // inclusive YYYY-MM-DD
  toExclusive: string  // exclusive YYYY-MM-DD (use < for SQL bounds)
  label: string
}

function dateIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function periodForPreset(preset: PeriodPreset, refYear?: number): PeriodRange | null {
  const now = new Date()
  const year = refYear ?? now.getUTCFullYear()
  const monthNow = now.getUTCMonth() + 1

  switch (preset) {
    case 'this_month': {
      const m = monthNow
      const next = new Date(Date.UTC(year, m, 1))
      return {
        from: dateIso(year, m, 1),
        toExclusive: dateIso(next.getUTCFullYear(), next.getUTCMonth() + 1, 1),
        label: `${monthLabel(`${year}-${String(m).padStart(2, '0')}`)}`,
      }
    }
    case 'last_month': {
      const m = monthNow
      const prev = new Date(Date.UTC(year, m - 2, 1))
      const py = prev.getUTCFullYear()
      const pm = prev.getUTCMonth() + 1
      return {
        from: dateIso(py, pm, 1),
        toExclusive: dateIso(year, m, 1),
        label: monthLabel(`${py}-${String(pm).padStart(2, '0')}`),
      }
    }
    case 'q1':
      return { from: dateIso(year, 1, 1), toExclusive: dateIso(year, 4, 1), label: `1er trimestre ${year}` }
    case 'q2':
      return { from: dateIso(year, 4, 1), toExclusive: dateIso(year, 7, 1), label: `2º trimestre ${year}` }
    case 'q3':
      return { from: dateIso(year, 7, 1), toExclusive: dateIso(year, 10, 1), label: `3er trimestre ${year}` }
    case 'q4':
      return { from: dateIso(year, 10, 1), toExclusive: dateIso(year + 1, 1, 1), label: `4º trimestre ${year}` }
    case 'ytd':
      return {
        from: dateIso(year, 1, 1),
        toExclusive: dateIso(year, monthNow, now.getUTCDate() + 1),
        label: `Año ${year} en curso`,
      }
    case 'last_year':
      return { from: dateIso(year - 1, 1, 1), toExclusive: dateIso(year, 1, 1), label: `Año ${year - 1}` }
    case 'custom':
      return null
  }
}

export function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

export function inclusiveEndLabel(toExclusive: string): string {
  // toExclusive es exclusivo en SQL; para mostrar al usuario restamos 1 día.
  const [y, m, d] = toExclusive.split('-').map(Number)
  const last = new Date(Date.UTC(y, m - 1, d - 1))
  return formatDateEs(
    `${last.getUTCFullYear()}-${String(last.getUTCMonth() + 1).padStart(2, '0')}-${String(last.getUTCDate()).padStart(2, '0')}`,
  )
}
