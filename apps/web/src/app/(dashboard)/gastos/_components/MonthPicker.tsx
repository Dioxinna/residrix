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
    <div className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded">
      <Link
        href={`/gastos?community=${selectedCommunityId}&month=${prev}`}
        scroll={false}
        className="px-2 py-1 text-zinc-400 hover:text-white"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={14} />
      </Link>
      <span className="text-xs text-zinc-300 px-2 capitalize min-w-[10ch] text-center">
        {monthLabel(selectedMonth)}
      </span>
      <Link
        href={`/gastos?community=${selectedCommunityId}&month=${next}`}
        scroll={false}
        className="px-2 py-1 text-zinc-400 hover:text-white"
        aria-label="Mes siguiente"
      >
        <ChevronRight size={14} />
      </Link>
    </div>
  )
}
