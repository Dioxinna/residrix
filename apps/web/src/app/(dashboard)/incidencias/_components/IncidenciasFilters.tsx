'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'open', label: 'Abierta' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'pending_neighbor', label: 'Pdte. vecino' },
  { value: 'resolved', label: 'Resuelta' },
  { value: 'closed', label: 'Cerrada' },
]

const urgencyOptions = [
  { value: '', label: 'Todas las urgencias' },
  { value: 'critical', label: 'Crítica' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
]

const categoryOptions = [
  { value: '', label: 'Todas las categorías' },
  { value: 'plumbing', label: 'Fontanería' },
  { value: 'electricity', label: 'Electricidad' },
  { value: 'cleaning', label: 'Limpieza' },
  { value: 'elevator', label: 'Ascensor' },
  { value: 'structure', label: 'Estructura' },
  { value: 'access', label: 'Acceso' },
  { value: 'noise', label: 'Ruido' },
  { value: 'other', label: 'Otros' },
]

const selectClass = 'glass border border-[color:var(--glass-border)] text-ink-soft text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500'

export function IncidenciasFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="search"
        placeholder="Buscar incidencia..."
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => updateParam('q', e.target.value)}
        className="glass border border-[color:var(--glass-border)] text-ink-soft text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 w-56 placeholder-zinc-500"
      />
      <select value={searchParams.get('status') ?? ''} onChange={(e) => updateParam('status', e.target.value)} className={selectClass}>
        {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select value={searchParams.get('urgency') ?? ''} onChange={(e) => updateParam('urgency', e.target.value)} className={selectClass}>
        {urgencyOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select value={searchParams.get('category') ?? ''} onChange={(e) => updateParam('category', e.target.value)} className={selectClass}>
        {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
