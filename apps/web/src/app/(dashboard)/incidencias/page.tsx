import { createSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StatusBadge, UrgencyBadge } from '@/components/ui/badges'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { IncidenceStatus, IncidenceUrgency, IncidenceCategory } from '@residrix/types'
import { IncidenciasFilters } from './_components/IncidenciasFilters'

interface PageProps {
  searchParams: Promise<{
    status?: IncidenceStatus
    urgency?: IncidenceUrgency
    category?: IncidenceCategory
    q?: string
  }>
}

const categoryLabels: Record<IncidenceCategory, string> = {
  plumbing:    'Fontanería',
  electricity: 'Electricidad',
  cleaning:    'Limpieza',
  elevator:    'Ascensor',
  structure:   'Estructura',
  access:      'Acceso',
  noise:       'Ruido',
  other:       'Otros',
}

export default async function IncidenciasPage({ searchParams }: PageProps) {
  const filters = await searchParams
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('incidences')
    .select('id, title, status, urgency, category, created_at, communities(name), profiles!reported_by(full_name)')
    .order('created_at', { ascending: false })

  if (filters.status)   query = query.eq('status', filters.status)
  if (filters.urgency)  query = query.eq('urgency', filters.urgency)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.q)        query = query.ilike('title', `%${filters.q}%`)

  const { data: incidences } = await query

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Incidencias</h1>
          <p className="text-ink-soft text-sm mt-1">{incidences?.length ?? 0} resultado{incidences?.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <IncidenciasFilters />

      <div className="bg-[color:var(--c-surface)] border border-[color:var(--glass-border)] rounded-xl overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--glass-border)] text-ink-soft text-xs uppercase tracking-wide">
              <th className="px-6 py-3 text-left">Título</th>
              <th className="px-6 py-3 text-left hidden md:table-cell">Comunidad</th>
              <th className="px-6 py-3 text-left hidden lg:table-cell">Categoría</th>
              <th className="px-6 py-3 text-left">Urgencia</th>
              <th className="px-6 py-3 text-left">Estado</th>
              <th className="px-6 py-3 text-left hidden md:table-cell">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--glass-border)]">
            {(!incidences || incidences.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-ink-faint">
                  No se encontraron incidencias
                </td>
              </tr>
            )}
            {incidences?.map((inc) => (
              <tr key={inc.id} className="hover:bg-[color:var(--glass-border)] transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/incidencias/${inc.id}`} className="text-ink hover:text-brand font-medium transition-colors line-clamp-1">
                    {inc.title}
                  </Link>
                  <p className="text-ink-faint text-xs mt-0.5">
                    {(inc.profiles as { full_name: string } | null)?.full_name ?? '—'}
                  </p>
                </td>
                <td className="px-6 py-4 text-ink-soft hidden md:table-cell">
                  {(inc.communities as { name: string } | null)?.name ?? '—'}
                </td>
                <td className="px-6 py-4 text-ink-soft hidden lg:table-cell">
                  {categoryLabels[inc.category as IncidenceCategory]}
                </td>
                <td className="px-6 py-4">
                  <UrgencyBadge urgency={inc.urgency as IncidenceUrgency} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={inc.status as IncidenceStatus} />
                </td>
                <td className="px-6 py-4 text-ink-faint text-xs hidden md:table-cell">
                  {formatDistanceToNow(new Date(inc.created_at ?? Date.now()), { addSuffix: true, locale: es })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
