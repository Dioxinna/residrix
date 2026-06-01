'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthLabel } from '@/lib/expenses'

function shift(monthIso: string, delta: number): string {
  const [y, m] = monthIso.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function MonthPicker({
  selectedMonth,
  selectedCommunityId,
}: {
  selectedMonth: string
  selectedCommunityId: string
}) {
  const prev = shift(selectedMonth, -1)
  const next = shift(selectedMonth, 1)
  return (
    <div className="inline-flex items-center gap-1 glass rounded">
      <Link
        href={`/gastos?community=${selectedCommunityId}&month=${prev}`}
        scroll={false}
        className="px-2 py-1 text-ink-soft hover:text-ink"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={14} />
      </Link>
      <span className="text-xs text-ink-soft px-2 capitalize min-w-[10ch] text-center">
        {monthLabel(selectedMonth)}
      </span>
      <Link
        href={`/gastos?community=${selectedCommunityId}&month=${next}`}
        scroll={false}
        className="px-2 py-1 text-ink-soft hover:text-ink"
        aria-label="Mes siguiente"
      >
        <ChevronRight size={14} />
      </Link>
    </div>
  )
}
