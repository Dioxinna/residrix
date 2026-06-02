'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { periodForPreset, type PeriodPreset } from '@/lib/expenses'

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'this_month', label: 'Este mes' },
  { value: 'last_month', label: 'Mes anterior' },
  { value: 'q1', label: 'Q1' },
  { value: 'q2', label: 'Q2' },
  { value: 'q3', label: 'Q3' },
  { value: 'q4', label: 'Q4' },
  { value: 'ytd', label: 'Año en curso' },
  { value: 'last_year', label: 'Año anterior' },
  { value: 'custom', label: 'Personalizado' },
]

function todayIso(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function plusOneDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`
}

export function LiquidacionPicker({
  communities,
}: {
  communities: { id: string; name: string }[]
}) {
  const router = useRouter()
  const currentYear = new Date().getUTCFullYear()
  const [communityId, setCommunityId] = useState(communities[0].id)
  const [preset, setPreset] = useState<PeriodPreset>('this_month')
  const [year, setYear] = useState(currentYear)
  const [customFrom, setCustomFrom] = useState(`${currentYear}-01-01`)
  const [customTo, setCustomTo] = useState(todayIso())

  const yearOptions = useMemo(() => {
    const years: number[] = []
    for (let y = currentYear; y >= currentYear - 5; y--) years.push(y)
    return years
  }, [currentYear])

  const presetNeedsYear = preset !== 'this_month' && preset !== 'last_month' && preset !== 'custom'

  function submit() {
    let from: string
    let toExclusive: string
    if (preset === 'custom') {
      from = customFrom
      toExclusive = plusOneDay(customTo) // toExclusive = day after the user-selected end
    } else {
      const range = periodForPreset(preset, year)
      if (!range) return
      from = range.from
      toExclusive = range.toExclusive
    }
    const params = new URLSearchParams({
      community: communityId,
      from,
      to: toExclusive,
    })
    router.push(`/liquidaciones/preview?${params.toString()}`)
  }

  return (
    <div className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded-xl p-6 space-y-5">
      <Field label="Comunidad">
        <select
          value={communityId}
          onChange={(e) => setCommunityId(e.target.value)}
          className="w-full bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {communities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Periodo">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const active = p.value === preset
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPreset(p.value)}
                className={`text-xs px-2.5 py-1 rounded border ${
                  active
                    ? 'bg-brand/15 border-brand/40 text-ink'
                    : 'bg-[color:var(--c-surface)] border-[color:var(--glass-border)] text-ink-soft hover:text-ink hover:border-[color:var(--glass-border)]'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </Field>

      {presetNeedsYear && (
        <Field label="Año">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-32 bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </Field>
      )}

      {preset === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Desde">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </Field>
          <Field label="Hasta (incluido)">
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-full bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </Field>
        </div>
      )}

      <div className="pt-2">
        <button
          onClick={submit}
          className="w-full bg-brand hover:bg-brand-soft text-white text-sm font-medium px-4 py-2.5 rounded"
        >
          Generar informe →
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-soft mb-1.5 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}
