'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { currentMonthIso, monthLabel } from '@/lib/expenses'

function shift(monthIso: string, delta: number): string {
  const [y, m] = monthIso.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function InformePicker({
  communities,
}: {
  communities: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [communityId, setCommunityId] = useState(communities[0].id)
  const [month, setMonth] = useState(shift(currentMonthIso(), -1)) // default: mes anterior cerrado

  const monthOptions: string[] = []
  for (let i = 0; i < 18; i++) {
    monthOptions.push(shift(currentMonthIso(), -i))
  }

  function submit() {
    const params = new URLSearchParams({ community: communityId, month })
    router.push(`/informes/preview?${params.toString()}`)
  }

  return (
    <div className="glass rounded-xl p-6 space-y-5">
      <Field label="Comunidad">
        <select
          value={communityId}
          onChange={(e) => setCommunityId(e.target.value)}
          className="w-full glass rounded px-3 py-2 text-sm text-ink"
        >
          {communities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Mes">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full glass rounded px-3 py-2 text-sm text-ink capitalize"
        >
          {monthOptions.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
      </Field>

      <button
        onClick={submit}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded"
      >
        Generar informe →
      </button>
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
